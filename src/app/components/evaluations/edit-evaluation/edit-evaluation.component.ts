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
  OnInit,
  Signal,
  signal,
  viewChildren,
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

@Component({
  selector: 'app-edit-evaluation',
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
  templateUrl: './edit-evaluation.component.html',
  styleUrl: './edit-evaluation.component.scss',
})
export class EditEvaluationComponent implements OnInit {
  dialogRef = inject(MatDialogRef<EditEvaluationComponent>);
  fb = inject(FormBuilder);
  playerService = inject(PlayerService);
  evaluationService = inject(EvaluationService);
  snackBar = inject(MatSnackBar);
  analytics = inject(Analytics);
  data = inject(MAT_DIALOG_DATA);
  program: Program = this.data.program;
  evaluation: Evaluation = this.data.evaluation;

  players: Signal<Player[]> = this.playerService.currentProgramPlayers;

  invalidTryoutNumber = signal<string>('');

  scoreEntryFields = viewChildren<ElementRef>('scoreEntry');

  evaluationForm = this.fb.group({
    evaluatorName: [this.evaluation.evaluatorName, Validators.required],
    evaluationDate: [
      this.evaluation.evaluationDate.toDate(),
      Validators.required,
    ],
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

  ngOnInit(): void {
    this.evaluation.scores.forEach((score) => {
      const field = `${score.category.charAt(0).toLowerCase()}${score.category
        .slice(1)
        .replace(/ (\w)/g, (_, c) => c.toUpperCase())}${score.score}`;
      const currentValue = this.evaluationForm.get(field).value;
      this.evaluationForm.patchValue({
        [field]: currentValue
          ? `${currentValue}\n${score.tryoutNumber}`
          : score.tryoutNumber,
      });
    });
  }

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
    let updatedEvaluation: Partial<Evaluation> = {
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
      updatedEvaluation.scores = scores;
      await this.evaluationService
        .updateEvaluation(
          this.program.id,
          this.evaluation.id,
          updatedEvaluation
        )
        .then(() => {
          this.dialogRef.close({ success: true });
        })
        .catch((err: Error) => {
          logEvent(this.analytics, 'error', {
            component: this.constructor.name,
            action: 'updateEvaluation',
            message: err.message,
          });
          this.snackBar.open('Error updating evaluation', 'Close', {
            verticalPosition: 'top',
          });
          this.evaluationForm.enable();
        });
    } catch (err) {
      this.evaluationForm.enable();
    }
  }
}
