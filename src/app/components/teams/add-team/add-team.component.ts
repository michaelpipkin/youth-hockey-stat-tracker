import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Program } from '@models/program';
import { Team } from '@models/team';
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
  selector: 'app-add-team',
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
  templateUrl: './add-team.component.html',
  styleUrl: './add-team.component.scss',
})
export class AddTeamComponent {
  dialogRef = inject(MatDialogRef<AddTeamComponent>);
  fb = inject(FormBuilder);
  teamService = inject(TeamService);
  snackBar = inject(MatSnackBar);
  analytics = inject(Analytics);
  data = inject(MAT_DIALOG_DATA);
  program: Program = this.data.program;

  teamForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  public get f() {
    return this.teamForm.controls;
  }

  onSubmit(): void {
    this.teamForm.disable();
    const formValues = this.teamForm.value;
    const newTeam: Partial<Team> = {
      name: formValues.name,
      description: formValues.description,
      headCoachRef: null,
      assistantCoach1Ref: null,
      assistantCoach2Ref: null,
      managerRef: null,
      otherCoaches: '',
    };
    this.teamService
      .addTeam(this.program.id, newTeam)
      .then(() => {
        this.dialogRef.close(true);
      })
      .catch((err: Error) => {
        logEvent(this.analytics, 'error', {
          component: this.constructor.name,
          action: 'addTeam',
          message: err.message,
        });
        this.snackBar.open('Error adding team', 'Close', {
          verticalPosition: 'top',
        });
        this.teamForm.enable();
      });
  }
}
