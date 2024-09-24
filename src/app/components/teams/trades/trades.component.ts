import { DatePipe } from '@angular/common';
import { Component, computed, inject, model, signal } from '@angular/core';
import { Analytics } from '@angular/fire/analytics';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { ProgramService } from '@services/program.service';
import { SortingService } from '@services/sorting.service';

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
    DatePipe,
  ],
  templateUrl: './trades.component.html',
  styleUrl: './trades.component.scss',
})
export class TradesComponent {
  programsService = inject(ProgramService);
  sorter = inject(SortingService);
  analytics = inject(Analytics);

  nameFilter = model<string>('');

  sortField = signal<string>('playerName');
  sortAsc = signal<boolean>(true);

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
}
