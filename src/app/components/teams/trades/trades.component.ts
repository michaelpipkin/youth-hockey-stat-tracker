import { DatePipe } from '@angular/common';
import { Component, computed, inject, model, signal } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProgramService } from '@services/program.service';
import { SortingService } from '@services/sorting.service';
import { ConfirmDialogComponent } from '@shared/confirm-dialog/confirm-dialog.component';
import { LoadingService } from '@shared/loading/loading.service';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogModule,
} from '@angular/material/dialog';

@Component({
  selector: 'app-trades',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    DatePipe,
  ],
  templateUrl: './trades.component.html',
  styleUrl: './trades.component.scss',
})
export class TradesComponent {
  programsService = inject(ProgramService);
  sorter = inject(SortingService);
  dialog = inject(MatDialog);
  loading = inject(LoadingService);
  snackBar = inject(MatSnackBar);
  analytics = inject(Analytics);

  nameFilter = model<string>('');

  sortField = signal<string>('playerName');
  sortAsc = signal<boolean>(true);

  currentProgramId = computed<string>(
    () => this.programsService.activeUserProgram().id
  );

  trades = computed((nameFilter: string = this.nameFilter()) => {
    let trades = this.programsService
      .programTrades()
      .filter((t) =>
        t.playerName.toLowerCase().includes(nameFilter.toLowerCase())
      );
    if (trades.length > 0) {
      trades = this.sorter.sort(trades, this.sortField(), this.sortAsc());
    }
    return trades;
  });

  sortTrades(e: { active: string; direction: string }): void {
    this.sortField.set(e.active);
    this.sortAsc.set(e.direction == 'asc');
  }

  deleteTrade(tradeId: string): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        dialogTitle: 'WARNING!',
        confirmationText:
          'Are you sure you want to delete this trade? This action cannot be undone.',
        cancelButtonText: 'No',
        confirmButtonText: 'Yes',
      },
    };
    const dialogRef = this.dialog.open(ConfirmDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(async (confirm) => {
      if (confirm) {
        this.loading.loadingOn();
        this.programsService
          .deleteTrade(this.currentProgramId(), tradeId)
          .then(() => {
            this.snackBar.open('Trade deleted.', 'Close');
          })
          .catch((err: Error) => {
            logEvent(this.analytics, 'error', {
              component: this.constructor.name,
              action: 'deleteTrade',
              message: err.message,
            });
            this.snackBar.open(
              'Something went wrong - could not delete trade',
              'Close'
            );
          })
          .finally(() => {
            this.loading.loadingOff();
          });
      }
    });
  }

  clearTrades(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        dialogTitle: 'WARNING!',
        confirmationText:
          'Are you sure you want to clear all trades? This action cannot be undone.',
        cancelButtonText: 'No',
        confirmButtonText: 'Yes',
      },
    };
    const dialogRef = this.dialog.open(ConfirmDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(async (confirm) => {
      if (confirm) {
        this.loading.loadingOn();
        this.programsService
          .clearTrades(this.currentProgramId())
          .then(() => {
            this.snackBar.open('Trades have been cleared.', 'Close');
          })
          .catch((err: Error) => {
            logEvent(this.analytics, 'error', {
              component: this.constructor.name,
              action: 'clearTrades',
              message: err.message,
            });
            this.snackBar.open(
              'Something went wrong - could not clear trades',
              'Close'
            );
          })
          .finally(() => {
            this.loading.loadingOff();
          });
      }
    });
  }
}
