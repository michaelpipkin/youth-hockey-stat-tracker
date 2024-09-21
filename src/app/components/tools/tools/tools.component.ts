import { Component, inject, signal, Signal } from '@angular/core';
import { Analytics } from '@angular/fire/analytics';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HelpComponent } from '@components/help/help.component';
import { Program } from '@models/program';
import { EvaluationService } from '@services/evaluation.service';
import { PlayerService } from '@services/player.service';
import { ProgramService } from '@services/program.service';
import { UserService } from '@services/user.service';
import { LoadingService } from '@shared/loading/loading.service';

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './tools.component.html',
  styleUrl: './tools.component.scss',
})
export class ToolsComponent {
  programService = inject(ProgramService);
  userService = inject(UserService);
  evaluationService = inject(EvaluationService);
  playerService = inject(PlayerService);
  loading = inject(LoadingService);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  analytics = inject(Analytics);

  currentProgram: Signal<Program> = this.programService.activeUserProgram;

  async processEvaluations(): Promise<void> {
    this.loading.loadingOn();
    await this.evaluationService
      .processEvaluations(this.currentProgram().id)
      .then(() => {
        this.snackBar.open('Evaluations processed', 'Close');
      })
      .finally(() => {
        this.loading.loadingOff();
      });
  }

  async assignPlayersToTeams(): Promise<void> {
    this.loading.loadingOn();
    await this.playerService
      .distributePlayersToTeams(this.currentProgram().id)
      .then(() => {
        this.snackBar.open('Players assigned to teams', 'Close');
      })
      .finally(() => {
        this.loading.loadingOff();
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
