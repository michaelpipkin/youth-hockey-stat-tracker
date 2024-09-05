import { DatePipe } from '@angular/common';
import { Analytics } from '@angular/fire/analytics';
import { User } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HelpComponent } from '@components/help/help.component';
import { Player } from '@models/player';
import { Program } from '@models/program';
import { Team } from '@models/team';
import { PlayerService } from '@services/player.service';
import { ProgramService } from '@services/program.service';
import { SortingService } from '@services/sorting.service';
import { TeamService } from '@services/team.service';
import { UserService } from '@services/user.service';
import { ClearSelectDirective } from '@shared/directives/clear-select.directive';
import { YesNoPipe } from '@shared/pipes/yes-no.pipe';
import { AddPlayersComponent } from '../add-players/add-players.component';
import { CreatePlayerComponent } from '../create-player/create-player.component';
import { EditPlayerComponent } from '../edit-player/edit-player.component';
import {
  Component,
  computed,
  inject,
  model,
  signal,
  Signal,
} from '@angular/core';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatTooltipModule,
    MatIconModule,
    MatSlideToggleModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    DatePipe,
    YesNoPipe,
    ClearSelectDirective,
  ],
  templateUrl: './players.component.html',
  styleUrl: './players.component.scss',
})
export class PlayersComponent {
  userService = inject(UserService);
  programService = inject(ProgramService);
  playerService = inject(PlayerService);
  teamService = inject(TeamService);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  sorter = inject(SortingService);
  analytics = inject(Analytics);

  #user: Signal<User> = this.userService.user;
  currentProgram: Signal<Program> = this.programService.activeUserProgram;
  players: Signal<Player[]> = this.playerService.currentProgramPlayers;
  teams: Signal<Team[]> = this.teamService.currentProgramTeams;

  sortField = signal<string>('lastFirstName');
  sortAsc = signal<boolean>(true);

  nameFilter = model<string>('');
  activeOnly = model<boolean>(true);
  selectedTeamId = model<string>('');

  filteredPlayers = computed(
    (
      nameFilter: string = this.nameFilter(),
      activeOnly: boolean = this.activeOnly(),
      selectedTeamId: string = this.selectedTeamId()
    ) => {
      return this.players().filter((player) => {
        return (
          (!nameFilter ||
            player.firstName.toLowerCase().includes(nameFilter) ||
            player.lastName.toLowerCase().includes(nameFilter)) &&
          (!activeOnly || player.active) &&
          (!selectedTeamId || player.teamId === selectedTeamId)
        );
      });
    }
  );
  playerCount = computed(() => this.filteredPlayers().length);

  sortPlayers(e: { active: string; direction: string }): void {
    this.sortField.set(e.active);
    this.sortAsc.set(e.direction == 'asc');
  }

  getTeamName(teamId: string): string {
    return this.teams().find((team) => team.id === teamId)?.name ?? '';
  }

  onRowClick(player: Player): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        player: player,
        user: this.#user(),
      },
    };
    const dialogRef = this.dialog.open(EditPlayerComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((res) => {
      if (res.success) {
        this.snackBar.open(`Player ${res.operation}`, 'Close');
      }
    });
  }

  createPlayer(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        user: this.#user(),
        programId: this.currentProgram().id,
      },
    };
    const dialogRef = this.dialog.open(CreatePlayerComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((res) => {
      if (res.success) {
        this.snackBar.open(`Player created`, 'Close');
      }
    });
  }

  addPlayers(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        user: this.#user(),
        programId: this.currentProgram().id,
      },
    };
    const dialogRef = this.dialog.open(AddPlayersComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((res) => {
      if (res.success) {
        this.snackBar.open(`Players added to program`, 'Close');
      }
    });
  }

  showHelp(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        page: 'players',
        title: 'Players Help',
      },
      disableClose: false,
      maxWidth: '80vw',
    };
    this.dialog.open(HelpComponent, dialogConfig);
  }
}
