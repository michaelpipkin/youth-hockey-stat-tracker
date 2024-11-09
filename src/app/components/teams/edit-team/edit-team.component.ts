import { CommonModule } from '@angular/common';
import { Component, computed, inject, Signal } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { DocumentReference } from '@angular/fire/firestore';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Guardian } from '@models/guardian';
import { Program } from '@models/program';
import { Team } from '@models/team';
import { PlayerService } from '@services/player.service';
import { TeamService } from '@services/team.service';
import { DeleteDialogComponent } from '@shared/delete-dialog/delete-dialog.component';
import { Coach } from '@shared/enums';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

@Component({
  selector: 'app-edit-team',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './edit-team.component.html',
  styleUrl: './edit-team.component.scss',
})
export class EditTeamComponent {
  dialogRef = inject(MatDialogRef<EditTeamComponent>);
  fb = inject(FormBuilder);
  playerService = inject(PlayerService);
  teamService = inject(TeamService);
  snackBar = inject(MatSnackBar);
  analytics = inject(Analytics);
  dialog = inject(MatDialog);
  data = inject(MAT_DIALOG_DATA);
  program: Program = this.data.program;
  team: Team = this.data.team;

  coaches: Signal<Guardian[]> = this.teamService.currentTeamCoaches;
  headCoaches = computed(() =>
    this.coaches().filter((c) => c.availableCoachRole === Coach.HC)
  );
  assistantCoaches = computed(() =>
    this.coaches().filter((c) => c.availableCoachRole === Coach.AC)
  );
  managers = computed(() =>
    this.coaches().filter((c) => c.availableCoachRole === Coach.M)
  );
  coachRefs: Signal<DocumentReference[]> =
    this.teamService.currentTeamCoachRefs;

  teamForm = this.fb.group({
    name: [this.team.name, Validators.required],
    description: [this.team.description],
    headCoachId: [this.team.headCoach?.id ?? '0'],
    assistantCoach1Id: [this.team.assistantCoach1?.id ?? '0'],
    assistantCoach2Id: [this.team.assistantCoach2?.id ?? '0'],
    managerId: [this.team.manager?.id ?? '0'],
    otherCoaches: this.team.otherCoaches,
  });

  public get f() {
    return this.teamForm.controls;
  }

  onSubmit(): void {
    this.teamForm.disable();
    const teamData = this.teamForm.value;
    const team: Partial<Team> = {
      name: teamData.name,
      description: teamData.description,
      headCoachRef:
        teamData.headCoachId !== '0'
          ? this.coachRefs().find((ref) => ref.id === teamData.headCoachId)
          : null,
      assistantCoach1Ref:
        teamData.assistantCoach1Id !== '0'
          ? this.coachRefs().find(
              (ref) => ref.id === teamData.assistantCoach1Id
            )
          : null,
      assistantCoach2Ref:
        teamData.assistantCoach2Id !== '0'
          ? this.coachRefs().find(
              (ref) => ref.id === teamData.assistantCoach2Id
            )
          : null,
      managerRef:
        teamData.managerId !== '0'
          ? this.coachRefs().find((ref) => ref.id === teamData.managerId)
          : null,
      otherCoaches: teamData.otherCoaches,
    };
    this.teamService
      .updateTeam(this.program.id, this.team.id, team)
      .then(() => {
        this.dialogRef.close({
          success: true,
          operation: 'updated',
        });
      })
      .catch((err: Error) => {
        logEvent(this.analytics, 'error', {
          component: this.constructor.name,
          action: 'updateTeam',
          message: err.message,
        });
        this.snackBar.open(err.message, 'Close', {
          verticalPosition: 'top',
        });
        this.teamForm.enable();
      });
  }

  deleteTeam(): void {
    const dialogConfig = {
      data: {
        operation: 'Delete',
        target: `team: ${this.team.name}`,
      },
    };
    const dialogRef = this.dialog.open(DeleteDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.teamService
          .deleteTeam(this.program.id, this.team.id)
          .then((res) => {
            if (res?.name === 'Error') {
              this.snackBar.open(res.message, 'Close');
            } else {
              this.dialogRef.close({
                success: true,
                operation: 'deleted',
              });
            }
          })
          .catch((err: Error) => {
            logEvent(this.analytics, 'error', {
              component: this.constructor.name,
              action: 'deleteTeam',
              message: err.message,
            });
            this.snackBar.open(err.message, 'Close');
          });
      }
    });
  }
}
