import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Program } from '@models/program';
import { TeamService } from '@services/team.service';
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
  selector: 'app-generate-teams',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
  ],
  templateUrl: './generate-teams.component.html',
  styleUrl: './generate-teams.component.scss',
})
export class GenerateTeamsComponent {
  dialogRef = inject(MatDialogRef<GenerateTeamsComponent>);
  fb = inject(FormBuilder);
  teamService = inject(TeamService);
  snackBar = inject(MatSnackBar);
  analytics = inject(Analytics);
  data = inject(MAT_DIALOG_DATA);
  program: Program = this.data.program;

  teamForm = this.fb.group({
    numTeams: ['', [Validators.required, Validators.min(1)]],
  });

  public get f() {
    return this.teamForm.controls;
  }

  onSubmit(): void {
    this.teamForm.disable();
    const formValues = this.teamForm.value;
    this.teamService
      .generateTeams(this.program.id, +formValues.numTeams)
      .then(() => {
        this.dialogRef.close(true);
      })
      .catch((err: Error) => {
        logEvent(this.analytics, 'error', {
          component: this.constructor.name,
          action: 'generateTeams',
          message: err.message,
        });
        this.snackBar.open('Error generating teams', 'Close', {
          verticalPosition: 'top',
        });
        this.teamForm.enable();
      });
  }
}
