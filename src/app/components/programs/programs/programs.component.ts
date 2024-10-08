import { User } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Program } from '@models/program';
import { AppUser } from '@models/user';
import { ProgramService } from '@services/program.service';
import { UserService } from '@services/user.service';
import { LoadingService } from '@shared/loading/loading.service';
import { AddProgramComponent } from '../add-program/add-program.component';
import { EditProgramComponent } from '../edit-program/edit-program.component';
import { ProgramsHelpComponent } from '../programs-help/programs-help.component';
import {
  Component,
  computed,
  effect,
  inject,
  model,
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
    MatTooltipModule,
    MatSlideToggleModule,
  ],
  templateUrl: './programs.component.html',
  styleUrl: './programs.component.scss',
})
export class ProgramsComponent {
  userService = inject(UserService);
  programService = inject(ProgramService);
  loading = inject(LoadingService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);

  #user: Signal<AppUser> = this.userService.user;
  userPrograms = computed(() => {
    return this.programService.userPrograms().filter((p) => p.active);
  });
  activeProgram: Signal<Program | null> = this.programService.activeUserProgram;

  selectedProgramId = model<string>(this.activeProgram()?.id ?? '');
  activeOnly = model<boolean>(true);

  constructor() {
    effect(
      () => {
        const activeProgram = this.activeProgram();
        if (activeProgram) {
          this.selectedProgramId.set(activeProgram.id);
        } else {
          this.selectedProgramId.set('');
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
    dialogRef.afterClosed().subscribe((res) => {
      if (res.success) {
        this.snackBar.open(`Program ${res.operation} successfully!`, 'Close');
      }
    });
  }

  showHelp(): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      maxWidth: '80vw',
    };
    this.dialog.open(ProgramsHelpComponent, dialogConfig);
  }
}
