import { DatePipe } from '@angular/common';
import { Component, inject, Signal } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Evaluation } from '@models/evaluation';
import { Program } from '@models/program';
import { EvaluationService } from '@services/evaluation.service';
import { ProgramService } from '@services/program.service';
import { DeleteDialogComponent } from '@shared/delete-dialog/delete-dialog.component';
import { EvaluationCategory } from '@shared/enums';
import { AddEvaluationComponent } from '../add-evaluation/add-evaluation.component';
import { EditEvaluationComponent } from '../edit-evaluation/edit-evaluation.component';
import { EvaluationsHelpComponent } from '../evaluations-help/evaluations-help.component';

@Component({
  selector: 'app-evaluations',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatExpansionModule,
    DatePipe,
  ],
  templateUrl: './evaluations.component.html',
  styleUrl: './evaluations.component.scss',
})
export class EvaluationsComponent {
  programService = inject(ProgramService);
  evaluationService = inject(EvaluationService);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  analytics = inject(Analytics);

  currentProgram: Signal<Program> = this.programService.activeUserProgram;
  evaluations: Signal<Evaluation[]> = this.evaluationService.programEvaluations;

  categories = Object.values(EvaluationCategory);

  getScores(
    evaluation: Evaluation,
    category: string,
    score: number
  ): {
    category: EvaluationCategory;
    tryoutNumber: string;
    score: number;
  }[] {
    const scores = evaluation.scores.filter(
      (s) => s.category === category && s.score === score
    );
    return scores;
  }

  downloadForm(): void {
    const pdfUrl = 'assets/docs/eval-form.pdf';
    window.open(pdfUrl, '_blank');
  }

  addEvaluation(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        program: this.currentProgram(),
      },
    };
    const dialogRef = this.dialog.open(AddEvaluationComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((res) => {
      if (res.success) {
        this.snackBar.open(`Evaluation added`, 'Close');
      }
    });
  }

  editEvaluation(evaluation: Evaluation): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        program: this.currentProgram(),
        evaluation,
      },
    };
    const dialogRef = this.dialog.open(EditEvaluationComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((res) => {
      if (res.success) {
        this.snackBar.open(`Evaluation updated`, 'Close');
      }
    });
  }

  deleteEvaluation(evaluation: Evaluation): void {
    const dialogConfig = {
      data: {
        operation: 'Delete',
        target: `this evaluation`,
      },
    };
    const deleteDialogRef = this.dialog.open(
      DeleteDialogComponent,
      dialogConfig
    );
    deleteDialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.evaluationService
          .deleteEvaluation(this.currentProgram().id, evaluation.id)
          .then((res) => {
            if (res?.name === 'Error') {
              this.snackBar.open(res.message, 'Close');
            } else {
              this.snackBar.open(`Evaluation deleted`, 'Close');
            }
          })
          .catch((err: Error) => {
            logEvent(this.analytics, 'error', {
              component: this.constructor.name,
              action: 'deleteEvaluation',
              message: err.message,
            });
            this.snackBar.open(err.message, 'Close');
          });
      }
    });
  }

  showHelp(): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      maxWidth: '80vw',
    };
    this.dialog.open(EvaluationsHelpComponent, dialogConfig);
  }
}
