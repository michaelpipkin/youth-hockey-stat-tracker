import { User } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HelpComponent } from '@components/help/help.component';
import { Program } from '@models/program';
import { ProgramService } from '@services/program.service';
import { UserService } from '@services/user.service';
import { AddProgramComponent } from '../add-program/add-program.component';
import { EditProgramComponent } from '../edit-program/edit-program.component';
import {
  Component,
  effect,
  inject,
  model,
  signal,
  Signal,
} from '@angular/core';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
  ],
  templateUrl: './programs.component.html',
  styleUrl: './programs.component.scss',
})
export class ProgramsComponent {
  userService = inject(UserService);
  programService = inject(ProgramService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);

  #user: Signal<User> = this.userService.user;
  userPrograms: Signal<Program[]> = this.programService.userPrograms;
  #activeProgram: Signal<Program | null> =
    this.programService.activeUserProgram;

  selectedProgramId = model<string>(this.#activeProgram()?.id ?? '');

  programDescription = signal<string>(this.#activeProgram()?.description ?? '');

  constructor() {
    effect(
      () => {
        const activeProgram = this.#activeProgram();
        if (activeProgram) {
          this.selectedProgramId.set(activeProgram.id);
          this.programDescription.set(activeProgram.description);
        } else {
          this.selectedProgramId.set('');
          this.programDescription.set('');
        }
      },
      {
        allowSignalWrites: true,
      }
    );
  }

  onSelectProgram(e: MatSelectChange): void {
    this.programService.setActiveProgram(e.value);
  }

  addProgram(): void {
    const dialogConfig: MatDialogConfig = {
      data: { user: this.#user() },
    };
    const dialogRef = this.dialog.open(AddProgramComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((success) => {
      if (success) {
        this.snackBar.open('Program added successfully!', 'Close');
      }
    });
  }

  editPrograms(): void {
    const dialogConfig: MatDialogConfig = {
      data: { user: this.#user() },
    };
    const dialogRef = this.dialog.open(EditProgramComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((success) => {
      if (success) {
        this.snackBar.open('Program updated successfully!', 'Close');
      }
    });
  }

  showHelp(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        page: 'programs',
        title: 'Programs Help',
      },
      disableClose: false,
      maxWidth: '80vw',
    };
    this.dialog.open(HelpComponent, dialogConfig);
  }
}
