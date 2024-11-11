import { Component, inject, model, signal } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { Timestamp } from '@angular/fire/firestore';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Guardian } from '@models/guardian';
import { Player } from '@models/player';
import { PlayerService } from '@services/player.service';
import { Coach, Gender, Goalie, TShirtSize } from '@shared/enums';
import { LoadingService } from '@shared/loading/loading.service';
import { Buffer } from 'buffer';
import ExcelJS from 'exceljs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

@Component({
  selector: 'app-import-players',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
  ],
  templateUrl: './import-players.component.html',
  styleUrl: './import-players.component.scss',
})
export class ImportPlayersComponent {
  dialogRef = inject(MatDialogRef<ImportPlayersComponent>);
  dialog = inject(MatDialog);
  fb = inject(FormBuilder);
  playerService = inject(PlayerService);
  loading = inject(LoadingService);
  snackBar = inject(MatSnackBar);
  analytics = inject(Analytics);
  data: any = inject(MAT_DIALOG_DATA);

  programId: string = this.data.programId;

  fileName = model<string>('');
  file = model<File | null>(null);

  disableForm = signal<boolean>(false);
  importErrors = signal<boolean>(false);

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file: File = input.files[0];
      this.file.set(file);
      this.fileName.set(file.name);
    }
  }

  removeFile(): void {
    this.file.set(null);
    this.fileName.set('');
  }

  async onSubmit() {
    const file = this.file();
    if (file) {
      this.disableForm.set(true);
      this.importErrors.set(false);
      const reader = new FileReader();
      let recordCount: number = 0;

      // Wrap the file reading and processing in a Promise
      await new Promise<void>((resolve) => {
        reader.onload = (e: any) => {
          this.loading.loadingOn();
          const data = new Uint8Array(e.target.result);
          const buffer = Buffer.from(data);

          const workbook = new ExcelJS.Workbook();

          workbook.xlsx.load(buffer as any).then(() => {
            const worksheet = workbook.getWorksheet('House_Report');

            const rowPromises = [];
            for (const row of worksheet.getRows(2, worksheet.rowCount - 1)) {
              if (row.getCell(2).value !== null) {
                const lastNameValue = row.getCell(4).value?.toString();
                const parentheticalRegex = /\(([^)]+)\)/g;
                // Extract values inside parentheses
                const parentheticals: string[] = [];
                let match: RegExpExecArray | null;
                while (
                  (match = parentheticalRegex.exec(lastNameValue)) !== null
                ) {
                  parentheticals.push(match[1]);
                }

                // Remove parentheticals from the original string
                const cleanedLastName = lastNameValue
                  .replace(parentheticalRegex, '')
                  .trim();

                const player: Partial<Player> = {
                  firstName: row.getCell(5).value?.toString() ?? '',
                  lastName: cleanedLastName,
                  gender: this.mapGenderToEnum(
                    row.getCell(3).value?.toString() ?? ''
                  ),
                  birthDate: this.getDobAsTimestamp(row.getCell(2).value),
                  address: {
                    street1: row.getCell(7).value?.toString() ?? '',
                    street2: '',
                    city: row.getCell(8).value?.toString() ?? '',
                    state: row.getCell(9).value?.toString() ?? '',
                    zipCode: row.getCell(10).value?.toString() ?? '',
                  },
                  usaHockeyNumber: row.getCell(19).value?.toString() ?? '',
                  goalie: this.mapGoalieToEnum(
                    row.getCell(20).value?.toString() ?? ''
                  ),
                  tShirtSize: this.mapTShirtSizeToEnum(
                    row.getCell(21).value?.toString() ?? ''
                  ),
                  importantInfo: row.getCell(22).value?.toString() ?? '',
                  evaluationScore: 0,
                  totalLooks: 0,
                };

                let guardians = [];

                const guardian1: Partial<Guardian> = {
                  firstName: row.getCell(12).value?.toString() ?? '',
                  lastName: row.getCell(13).value?.toString() ?? '',
                  email: row.getCell(14).value?.toString() ?? '',
                  phone: row.getCell(11).value?.toString() ?? '',
                  availableCoachRole: this.mapCoachToEnum(parentheticals),
                };
                guardians.push(guardian1);

                if (row.getCell(16).value?.toString()) {
                  const guardian2: Partial<Guardian> = {
                    firstName: row.getCell(16).value?.toString() ?? '',
                    lastName: row.getCell(17).value?.toString() ?? '',
                    email: row.getCell(18).value?.toString() ?? '',
                    phone: row.getCell(15).value?.toString() ?? '',
                    availableCoachRole: this.mapCoachToEnum(parentheticals),
                  };
                  guardians.push(guardian2);
                }

                const playerPromise = this.playerService
                  .addPlayer(player, guardians, this.programId, true)
                  .then((result) => {
                    if (result !== 0) {
                      console.log(
                        `Player added: ${player.firstName} ${player.lastName}`
                      );
                      recordCount++;
                    }
                  })
                  .catch((err) => {
                    logEvent(this.analytics, 'error', {
                      component: this.constructor.name,
                      action: 'importPlayers',
                      message: err.message,
                    });
                    if (err.message !== 'Player already exists') {
                      this.importErrors.set(true);
                    }
                  });

                rowPromises.push(playerPromise);
              }
            }

            // Wait for all promises to resolve/reject
            Promise.all(rowPromises)
              .then(() => {
                this.loading.loadingOff();
                resolve();
              })
              .catch((err) => {
                this.loading.loadingOff();
                console.error('Error processing players:', err);
              });
          });
        };

        reader.readAsArrayBuffer(file);
      }); // End of the outer Promise

      if (this.importErrors()) {
        this.snackBar.open(
          'There was a problem importing at least one player. Please check the players page.',
          'Close',
          {
            verticalPosition: 'top',
          }
        );
        this.dialogRef.close();
      } else {
        if (recordCount === 0) {
          this.snackBar.open('No new players were imported.', 'Close', {
            verticalPosition: 'top',
          });
        } else {
          this.snackBar.open(
            `Success! Imported ${recordCount} ${
              recordCount > 1 ? 'players' : 'player'
            }.`,
            'Close',
            {
              verticalPosition: 'top',
            }
          );
        }
        this.dialogRef.close();
      }
    }
  }

  private getDobAsTimestamp(birthDate: ExcelJS.CellValue): Timestamp | null {
    if (birthDate instanceof Date) {
      // Get the date components in UTC
      const year = birthDate.getUTCFullYear();
      const month = birthDate.getUTCMonth();
      const day = birthDate.getUTCDate();

      // Create a new Date object with the extracted date components
      return new Date(year, month, day) as unknown as Timestamp;
    }
    return null;
  }

  private mapGenderToEnum(genderValue: string) {
    return genderValue === 'Male'
      ? Gender.M
      : genderValue === 'Female'
      ? Gender.F
      : Gender.N;
  }

  private mapTShirtSizeToEnum(tShirtSizeValue: string) {
    return tShirtSizeValue === 'Youth XS'
      ? TShirtSize.YXS
      : tShirtSizeValue === 'Youth S'
      ? TShirtSize.YS
      : tShirtSizeValue === 'Youth M'
      ? TShirtSize.YM
      : tShirtSizeValue === 'Youth L'
      ? TShirtSize.YL
      : tShirtSizeValue === 'Youth XL'
      ? TShirtSize.YXL
      : tShirtSizeValue === 'Adult XS'
      ? TShirtSize.AXS
      : tShirtSizeValue === 'Adult S'
      ? TShirtSize.AS
      : tShirtSizeValue === 'Adult M'
      ? TShirtSize.AM
      : tShirtSizeValue === 'Adult L'
      ? TShirtSize.AL
      : tShirtSizeValue === 'Adult XL'
      ? TShirtSize.AXL
      : TShirtSize.U;
  }

  private mapGoalieToEnum(goalieValue: string) {
    return goalieValue === 'Yes'
      ? Goalie.Y
      : goalieValue === 'No'
      ? Goalie.N
      : Goalie.M;
  }

  private mapCoachToEnum(coachValue: string[]) {
    return coachValue.includes('HC')
      ? Coach.HC
      : coachValue.includes('AC')
      ? Coach.AC
      : coachValue.includes('M')
      ? Coach.M
      : Coach.N;
  }
}
