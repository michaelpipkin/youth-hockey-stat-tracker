import { Component, inject, Signal } from '@angular/core';
import { Analytics } from '@angular/fire/analytics';
import { User } from '@angular/fire/auth';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HelpComponent } from '@components/help/help.component';
import { Program } from '@models/program';
import { Team } from '@models/team';
import { PlayerService } from '@services/player.service';
import { ProgramService } from '@services/program.service';
import { TeamService } from '@services/team.service';
import { UserService } from '@services/user.service';
import { AddTeamComponent } from '../add-team/add-team.component';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss',
})
export class TeamsComponent {
  userService = inject(UserService);
  programService = inject(ProgramService);
  playerService = inject(PlayerService);
  teamService = inject(TeamService);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  analytics = inject(Analytics);

  #user: Signal<User> = this.userService.user;
  currentProgram: Signal<Program> = this.programService.activeUserProgram;
  teams: Signal<Team[]> = this.teamService.currentProgramTeams;

  addTeam(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        user: this.#user(),
        program: this.currentProgram(),
      },
    };
    const dialogRef = this.dialog.open(AddTeamComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((res) => {
      if (res.success) {
        this.snackBar.open(`Team added`, 'Close');
      }
    });
  }

  showHelp(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        page: 'teams',
        title: 'Teams Help',
      },
      disableClose: false,
      maxWidth: '80vw',
    };
    this.dialog.open(HelpComponent, dialogConfig);
  }
}
