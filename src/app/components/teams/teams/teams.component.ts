import { DecimalPipe } from '@angular/common';
import { Component, inject, Signal } from '@angular/core';
import { Analytics } from '@angular/fire/analytics';
import { User } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HelpComponent } from '@components/help/help.component';
import { EditPlayerComponent } from '@components/players/edit-player/edit-player.component';
import { Player } from '@models/player';
import { Program } from '@models/program';
import { Team } from '@models/team';
import { PlayerService } from '@services/player.service';
import { ProgramService } from '@services/program.service';
import { TeamService } from '@services/team.service';
import { UserService } from '@services/user.service';
import { CoachRolePipe } from '@shared/pipes/coach-role.pipe';
import { YesNoPipe } from '@shared/pipes/yes-no.pipe';
import { AddTeamComponent } from '../add-team/add-team.component';
import { EditTeamComponent } from '../edit-team/edit-team.component';
import { GenerateTeamsComponent } from '../generate-teams/generate-teams.component';
import { TransferPlayerComponent } from '../transfer-player/transfer-player.component';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatTooltipModule,
    YesNoPipe,
    DecimalPipe,
    CoachRolePipe,
  ],
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
  players: Signal<Player[]> = this.playerService.currentProgramPlayers;

  public getTeamPlayers(teamId: string): Player[] {
    return this.players().filter((p) => p.teamRef?.id === teamId);
  }

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

  generateTeams(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        program: this.currentProgram(),
      },
    };
    const dialogRef = this.dialog.open(GenerateTeamsComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((res) => {
      if (res.success) {
        this.snackBar.open(`Teams generated`, 'Close');
      }
    });
  }

  async editTeam(team: Team): Promise<void> {
    await this.teamService.getTeamCoaches(this.currentProgram().id, team.id);
    const dialogConfig: MatDialogConfig = {
      data: {
        user: this.#user(),
        program: this.currentProgram(),
        team,
      },
    };
    const dialogRef = this.dialog.open(EditTeamComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((res) => {
      if (res.success) {
        this.snackBar.open(`Team updated`, 'Close');
      }
    });
  }

  editPlayer(player: Player): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        player: player,
      },
    };
    const dialogRef = this.dialog.open(EditPlayerComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((res) => {
      if (res.success) {
        this.snackBar.open(`Player ${res.operation}`, 'Close');
        this.teamService.getProgramTeams(this.currentProgram().id);
      }
    });
  }

  removePlayer(player: Player): void {
    this.playerService.removePlayerFromTeam(player).then(() => {
      this.snackBar.open('Player removed from team', 'Close');
      this.teamService.getProgramTeams(this.currentProgram().id);
    });
  }

  transferPlayer(player: Player): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        player: player,
        teams: this.teams().filter((t) => t.id !== player.teamRef.id),
      },
    };
    const dialogRef = this.dialog.open(TransferPlayerComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((res) => {
      if (res.success) {
        this.snackBar.open(`Player transferred`, 'Close');
        this.teamService.getProgramTeams(this.currentProgram().id);
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