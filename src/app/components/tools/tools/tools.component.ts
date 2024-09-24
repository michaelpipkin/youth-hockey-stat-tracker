import { Component, inject, signal, Signal } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Program } from '@models/program';
import { EvaluationService } from '@services/evaluation.service';
import { PlayerService } from '@services/player.service';
import { ProgramService } from '@services/program.service';
import { ConfirmDialogComponent } from '@shared/confirm-dialog/confirm-dialog.component';
import { LoadingService } from '@shared/loading/loading.service';
import { ToolsHelpComponent } from '../tools-help/tools-help.component';

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './tools.component.html',
  styleUrl: './tools.component.scss',
})
export class ToolsComponent {
  programService = inject(ProgramService);
  evaluationService = inject(EvaluationService);
  playerService = inject(PlayerService);
  loading = inject(LoadingService);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  analytics = inject(Analytics);

  currentProgram: Signal<Program> = this.programService.activeUserProgram;

  async processEvaluations(): Promise<void> {
    const dialogConfig: MatDialogConfig = {
      data: {
        dialogTitle: 'Calculate Evaluation Results',
        confirmationText:
          'Do you want to calculate evaluation results? This will overwrite any existing results.',
        cancelButtonText: 'No',
        confirmButtonText: 'Yes',
      },
    };
    const dialogRef = this.dialog.open(ConfirmDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(async (confirm) => {
      if (confirm) {
        this.loading.loadingOn();
        await this.evaluationService
          .processEvaluations(this.currentProgram().id)
          .then(() => {
            this.snackBar.open('Evaluations processed', 'Close');
          })
          .catch((err: Error) => {
            logEvent(this.analytics, 'error', {
              component: this.constructor.name,
              action: 'calculateEvaluationResults',
              message: err.message,
            });
            this.snackBar.open(
              'Something went wrong - could not calculate evaluation results',
              'Close'
            );
          })
          .finally(() => {
            this.loading.loadingOff();
          });
      }
    });
  }

  async assignPlayersToTeams(): Promise<void> {
    const dialogConfig: MatDialogConfig = {
      data: {
        dialogTitle: 'Auto-Assign Players to Teams',
        confirmationText:
          'Are you sure you want to auto-assign players to teams? This will clear all existing team assignments.',
        cancelButtonText: 'No',
        confirmButtonText: 'Yes',
      },
    };
    const dialogRef = this.dialog.open(ConfirmDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(async (confirm) => {
      if (confirm) {
        this.loading.loadingOn();
        await this.playerService
          .distributePlayersToTeams(this.currentProgram().id)
          .then(() => {
            this.snackBar.open('Players assigned to teams', 'Close');
          })
          .catch((err: Error) => {
            logEvent(this.analytics, 'error', {
              component: this.constructor.name,
              action: 'autoAssignPlayers',
              message: err.message,
            });
            this.snackBar.open(
              'Something went wrong - could not auto-assign players to teams',
              'Close'
            );
          })
          .finally(() => {
            this.loading.loadingOff();
          });
      }
    });
  }

  async clearAllTeams(): Promise<void> {
    const dialogConfig: MatDialogConfig = {
      data: {
        dialogTitle: 'WARNING!',
        confirmationText:
          'Are you sure you want to remove all players from all teams? This action cannot be undone.',
        cancelButtonText: 'No',
        confirmButtonText: 'Yes',
      },
    };
    const dialogRef = this.dialog.open(ConfirmDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(async (confirm) => {
      if (confirm) {
        this.loading.loadingOn();
        await this.playerService
          .clearAllTeamsPlayers(this.currentProgram().id)
          .then(() => {
            this.snackBar.open('Teams cleared', 'Close');
          })
          .catch((err: Error) => {
            logEvent(this.analytics, 'error', {
              component: this.constructor.name,
              action: 'clearTeams',
              message: err.message,
            });
            this.snackBar.open(
              'Something went wrong - could not clear team players',
              'Close'
            );
          })
          .finally(() => {
            this.loading.loadingOff();
          });
      }
    });
  }

  async resetProgram(): Promise<void> {
    const dialogConfig: MatDialogConfig = {
      data: {
        dialogTitle: 'WARNING!',
        confirmationText:
          'Are you sure you want to reset the program? This will remove all players from the program and delete all teams and trade history. This action cannot be undone.',
        cancelButtonText: 'No',
        confirmButtonText: 'Yes',
      },
    };
    const dialogRef = this.dialog.open(ConfirmDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(async (confirm) => {
      if (confirm) {
        this.loading.loadingOn();
        await this.programService
          .resetProgram(this.currentProgram().id)
          .then(() => {
            this.snackBar.open('Program reset', 'Close');
          })
          .catch((err: Error) => {
            logEvent(this.analytics, 'error', {
              component: this.constructor.name,
              action: 'resetProgram',
              message: err.message,
            });
            this.snackBar.open(
              'Something went wrong - could not reset program',
              'Close'
            );
          })
          .finally(() => {
            this.loading.loadingOff();
          });
      }
    });
  }

  showHelp(): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      maxWidth: '80vw',
    };
    this.dialog.open(ToolsHelpComponent, dialogConfig);
  }
}
