import { Component, inject } from '@angular/core';
import { Analytics } from '@angular/fire/analytics';
import { User } from '@angular/fire/auth';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Program } from '@models/program';
import { Team } from '@models/team';
import { TeamService } from '@services/team.service';

@Component({
  selector: 'app-edit-team',
  standalone: true,
  imports: [],
  templateUrl: './edit-team.component.html',
  styleUrl: './edit-team.component.scss',
})
export class EditTeamComponent {
  dialogRef = inject(MatDialogRef<EditTeamComponent>);
  fb = inject(FormBuilder);
  teamService = inject(TeamService);
  snackBar = inject(MatSnackBar);
  analytics = inject(Analytics);
  data = inject(MAT_DIALOG_DATA);
  user: User = this.data.user;
  program: Program = this.data.program;
  team: Team = this.data.team;

  teamForm = this.fb.group({
    name: [this.team.name],
    description: [this.team.description],
  });
}
