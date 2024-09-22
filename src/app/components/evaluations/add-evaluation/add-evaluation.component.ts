import { Analytics, logEvent } from '@angular/fire/analytics';
import { Timestamp } from '@angular/fire/firestore';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Evaluation } from '@models/evaluation';
import { Player } from '@models/player';
import { Program } from '@models/program';
import { EvaluationService } from '@services/evaluation.service';
import { PlayerService } from '@services/player.service';
import { EvaluationCategory } from '@shared/enums';
import {
  Component,
  ElementRef,
  inject,
  signal,
  Signal,
  viewChildren,
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

@Component({
  selector: 'app-add-evaluation',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './add-evaluation.component.html',
  styleUrl: './add-evaluation.component.scss',
})
export class AddEvaluationComponent {
  dialogRef = inject(MatDialogRef<AddEvaluationComponent>);
  fb = inject(FormBuilder);
  playerService = inject(PlayerService);
  evaluationService = inject(EvaluationService);
  snackBar = inject(MatSnackBar);
  analytics = inject(Analytics);
  data = inject(MAT_DIALOG_DATA);
  program: Program = this.data.program;

  players: Signal<Player[]> = this.playerService.currentProgramPlayers;

  invalidTryoutNumber = signal<string>('');

  scoreEntryFields = viewChildren<ElementRef>('scoreEntry');

  evaluationForm = this.fb.group({
    evaluatorName: ['', Validators.required],
    evaluationDate: [new Date(), Validators.required],
    skating1: [''],
    skating2: [''],
    skating3: [''],
    puckControl1: [''],
    puckControl2: [''],
    puckControl3: [''],
    shooting1: [''],
    shooting2: [''],
    shooting3: [''],
    gamePlay1: [''],
    gamePlay2: [''],
    gamePlay3: [''],
  });

  public get f() {
    return this.evaluationForm.controls;
  }

  autoGrow(event: Event) {
    const textArea = event.target as HTMLTextAreaElement;
    const currentHeight = textArea.offsetHeight + 'px';
    textArea.style.height = 'auto';
    const newHeight = textArea.scrollHeight + 'px';

    const currentHeightValue = parseFloat(currentHeight.replace('px', ''));
    const newHeightValue = parseFloat(newHeight.replace('px', ''));
    if (currentHeightValue < newHeightValue) {
      this.scoreEntryFields().forEach((field) => {
        const input = field.nativeElement as HTMLTextAreaElement;
        input.style.height = newHeight;
      });
    } else {
      textArea.style.height = currentHeight;
    }
  }

  async onSubmit(): Promise<void> {
    this.evaluationForm.disable();
    this.invalidTryoutNumber.set('');
    const formValues = this.evaluationForm.value;
    let evaluation: Partial<Evaluation> = {
      evaluatorName: formValues.evaluatorName,
      evaluationDate: Timestamp.fromDate(formValues.evaluationDate),
    };
    let scores: {
      category: EvaluationCategory;
      tryoutNumber: string;
      score: number;
    }[] = [];
    const categories = [
      { field: 'skating', category: EvaluationCategory.SK },
      { field: 'puckControl', category: EvaluationCategory.PC },
      { field: 'shooting', category: EvaluationCategory.SH },
      { field: 'gamePlay', category: EvaluationCategory.GP },
    ];
    try {
      categories.forEach(({ field, category }) => {
        for (let i = 1; i <= 3; i++) {
          const values = formValues[`${field}${i}`]
            .split('\n')
            .filter((value) => value.trim() !== '');
          values.forEach((value: string) => {
            if (!this.players().some((p) => p.tryoutNumber === value.trim())) {
              this.invalidTryoutNumber.set(
                `Tryout number ${value.trim()} is not assigned to a player in this program.`
              );
              throw new Error('Invalid tryout number');
            }
            scores.push({
              category,
              tryoutNumber: value.trim(),
              score: i,
            });
          });
        }
      });
      evaluation.scores = scores;
      await this.evaluationService
        .addEvaluation(this.program.id, evaluation)
        .then(() => {
          this.dialogRef.close({ success: true });
        })
        .catch((err: Error) => {
          logEvent(this.analytics, 'error', {
            component: this.constructor.name,
            action: 'addEvaluation',
            message: err.message,
          });
          this.snackBar.open('Error adding evaluation', 'Close', {
            verticalPosition: 'top',
          });
          this.evaluationForm.enable();
        });
    } catch (err) {
      this.evaluationForm.enable();
    }
  }
}
