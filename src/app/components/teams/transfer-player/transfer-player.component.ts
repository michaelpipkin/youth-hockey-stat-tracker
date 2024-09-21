import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Player } from '@models/player';
import { Team } from '@models/team';
import { PlayerService } from '@services/player.service';
import { TeamService } from '@services/team.service';
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
  selector: 'app-transfer-player',
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
    MatOptionModule,
  ],
  templateUrl: './transfer-player.component.html',
  styleUrl: './transfer-player.component.scss',
})
export class TransferPlayerComponent {
  dialogRef = inject(MatDialogRef<TransferPlayerComponent>);
  fb = inject(FormBuilder);
  teamService = inject(TeamService);
  playerService = inject(PlayerService);
  snackBar = inject(MatSnackBar);
  analytics = inject(Analytics);
  dialog = inject(MatDialog);
  data = inject(MAT_DIALOG_DATA);
  player: Player = this.data.player;
  teams: Team[] = this.data.teams;

  teamForm = this.fb.group({
    teamId: ['', Validators.required],
  });

  public get f() {
    return this.teamForm.controls;
  }

  onSubmit() {
    this.teamForm.disable();
    const formValues = this.teamForm.value;
    const teamId = formValues.teamId;
    this.playerService
      .transferPlayer(this.player, teamId)
      .then(() => {
        this.dialogRef.close(true);
      })
      .catch((err: Error) => {
        logEvent(this.analytics, 'error', {
          component: this.constructor.name,
          action: 'transferPlayer',
          message: err.message,
        });
        this.snackBar.open('Error transferring player', 'Close', {
          verticalPosition: 'top',
        });
        this.teamForm.enable();
      });
  }
}
