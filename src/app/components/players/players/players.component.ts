import { DatePipe, DecimalPipe } from '@angular/common';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { User } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox, MatCheckboxModule } from '@angular/material/checkbox';
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
import { ConfirmDialogComponent } from '@shared/confirm-dialog/confirm-dialog.component';
import { ClearSelectDirective } from '@shared/directives/clear-select.directive';
import { LoadingService } from '@shared/loading/loading.service';
import { YesNoPipe } from '@shared/pipes/yes-no.pipe';
import { AddPlayerComponent } from '../add-player/add-player.component';
import { EditPlayerComponent } from '../edit-player/edit-player.component';
import {
  Component,
  computed,
  inject,
  model,
  signal,
  Signal,
  viewChildren,
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
    MatCheckboxModule,
    DatePipe,
    YesNoPipe,
    DecimalPipe,
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
  loading = inject(LoadingService);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  sorter = inject(SortingService);
  analytics = inject(Analytics);

  #user: Signal<User> = this.userService.user;
  currentProgram: Signal<Program> = this.programService.activeUserProgram;
  players: Signal<Player[]> = this.playerService.currentProgramPlayers;
  programs: Signal<Program[]> = this.programService.userPrograms;
  activePrograms = computed(() => this.programs().filter((p) => p.active));
  teams: Signal<Team[]> = this.teamService.currentProgramTeams;

  nextTryoutNumber: Signal<string> = computed(() => {
    const players = this.players().filter((player) => player.tryoutNumber);
    const nextTryoutNumber =
      players.length > 0
        ? Math.max(...players.map((player) => +player.tryoutNumber)) + 1
        : 1;
    return `${nextTryoutNumber}`;
  });

  sortField = signal<string>('lastFirstName');
  sortAsc = signal<boolean>(true);

  nameFilter = model<string>('');
  showUnassigned = model<boolean>(false);
  selectedTeamId = model<string>('');

  assignCheckboxes = viewChildren<MatCheckbox>('assignCheckbox');

  filteredPlayers = computed(
    (
      nameFilter: string = this.nameFilter(),
      showUnassigned: boolean = this.showUnassigned(),
      selectedTeamId: string = this.selectedTeamId()
    ) => {
      let players = this.players().filter((player) => {
        return (
          (!nameFilter ||
            player.firstName.toLowerCase().includes(nameFilter) ||
            player.lastName.toLowerCase().includes(nameFilter)) &&
          (showUnassigned || player.programRef !== null) &&
          (!selectedTeamId ||
            (selectedTeamId === '0'
              ? !player.teamRef
              : player.teamRef.id === selectedTeamId))
        );
      });
      if (players.length > 0) {
        players = this.sorter.sort(players, this.sortField(), this.sortAsc());
      }
      return players;
    }
  );
  playerCount = computed(() => this.filteredPlayers().length);

  sortPlayers(e: { active: string; direction: string }): void {
    this.sortField.set(e.active);
    this.sortAsc.set(e.direction == 'asc');
  }

  getProgramName(programId: string): string {
    return (
      this.programs().find((program) => program.id === programId)?.name ?? ''
    );
  }

  getTeamName(teamId: string): string {
    return this.teams().find((team) => team.id === teamId)?.name ?? '';
  }

  getCheckedPlayers(): string[] {
    const checkedPlayers: string[] = [];
    this.assignCheckboxes().forEach((checkbox, index) => {
      if (checkbox.checked) {
        checkedPlayers.push(this.players()[index].id);
      }
    });
    return checkedPlayers;
  }

  onRowClick(player: Player): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        player: player,
      },
    };
    const dialogRef = this.dialog.open(EditPlayerComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(async (res) => {
      if (res.success) {
        this.snackBar.open(`Player ${res.operation}`, 'Close');
        this.loading.loadingOn();
        await this.playerService
          .getProgramPlayers(this.currentProgram().id)
          .then(() => {
            this.loading.loadingOff();
          });
      }
    });
  }

  addNewPlayer(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        user: this.#user(),
        program: this.currentProgram(),
        nextTryoutNumber: this.nextTryoutNumber(),
      },
    };
    const dialogRef = this.dialog.open(AddPlayerComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((res) => {
      if (res.success) {
        this.snackBar.open(`Player created`, 'Close');
      }
    });
  }

  assignPlayers(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        dialogTitle: 'Confirm Action',
        confirmationText: `Are you sure you want to assign the selected players to ${
          this.currentProgram().name
        }?`,
        cancelButtonText: 'No',
        confirmButtonText: 'Yes',
      },
    };
    const dialogRef = this.dialog.open(ConfirmDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        const playerIds = this.getCheckedPlayers();
        this.playerService
          .addPlayersToProgram(this.currentProgram().id, playerIds)
          .then(() => {
            this.snackBar.open(
              `Selected players assigned to ${this.currentProgram().name}`,
              'Close'
            );
          })
          .catch((err: Error) => {
            logEvent(this.analytics, 'error', {
              component: this.constructor.name,
              action: 'assignPlayers',
              message: err.message,
            });
            this.snackBar.open(
              'Something went wrong - could not assign players',
              'Close'
            );
          });
      }
    });
  }

  addPlayerToProgram(player: Player): void {
    this.playerService
      .addPlayerToProgram(player.id, this.currentProgram().id)
      .catch((err: Error) => {
        logEvent(this.analytics, 'error', {
          component: this.constructor.name,
          action: 'addPlayer',
          message: err.message,
        });
        this.snackBar.open(
          'Something went wrong - could not add player',
          'Close'
        );
      });
  }

  removePlayer(player: Player): void {
    this.playerService
      .removePlayerFromProgram(player.id)
      .catch((err: Error) => {
        logEvent(this.analytics, 'error', {
          component: this.constructor.name,
          action: 'removePlayer',
          message: err.message,
        });
        this.snackBar.open(
          'Something went wrong - could not remove player',
          'Close'
        );
      });
  }

  clearPlayers(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        dialogTitle: 'Confirm Action',
        confirmationText:
          'This will remove all players from the program. Are you sure you want to continue?',
        cancelButtonText: 'No',
        confirmButtonText: 'Yes',
      },
    };
    const dialogRef = this.dialog.open(ConfirmDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.playerService
          .clearProgramPlayers(this.currentProgram().id)
          .then(() => {
            this.snackBar.open('All players removed from program', 'Close');
          })
          .catch((err: Error) => {
            logEvent(this.analytics, 'error', {
              component: this.constructor.name,
              action: 'clearPlayers',
              message: err.message,
            });
            this.snackBar.open(
              'Something went wrong - could not clear players',
              'Close'
            );
          });
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
