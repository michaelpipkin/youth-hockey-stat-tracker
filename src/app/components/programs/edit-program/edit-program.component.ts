import { Component, inject, model, Signal } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Program } from '@models/program';
import { AppUser } from '@models/user';
import { ProgramService } from '@services/program.service';
import { DeleteDialogComponent } from '@shared/delete-dialog/delete-dialog.component';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
  MatDialog,
} from '@angular/material/dialog';

@Component({
  selector: 'app-edit-program',
  standalone: true,
  imports: [
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatTooltipModule,
    MatSlideToggleModule,
  ],
  templateUrl: './edit-program.component.html',
  styleUrl: './edit-program.component.scss',
})
export class EditProgramComponent {
  dialogRef = inject(MatDialogRef<EditProgramComponent>);
  fb = inject(FormBuilder);
  programService = inject(ProgramService);
  snackBar = inject(MatSnackBar);
  analytics = inject(Analytics);
  dialog = inject(MatDialog);
  data: any = inject(MAT_DIALOG_DATA);
  user: AppUser = this.data.user;

  userPrograms: Signal<Program[]> = this.programService.userPrograms;

  selectedProgram = model<Program>(null);

  editProgramForm = this.fb.group({
    name: [{ value: '', disabled: true }, Validators.required],
    description: { value: '', disabled: true },
    active: { value: false, disabled: true },
  });

  public get f() {
    return this.editProgramForm.controls;
  }

  //TODO: Add toggle to set active status of program

  onSelectProgram(): void {
    this.editProgramForm.patchValue({
      name: this.selectedProgram().name,
      description: this.selectedProgram().description,
      active: this.selectedProgram().active,
    });
    this.f.name.enable();
    this.f.description.enable();
    this.f.active.enable();
    this.editProgramForm.markAsPristine();
  }

  onSubmit(): void {
    this.editProgramForm.disable();
    const formValues = this.editProgramForm.value;
    const updatedProgram: Partial<Program> = {
      name: formValues.name,
      description: formValues.description,
      active: formValues.active,
    };
    this.programService
      .updateProgram(this.selectedProgram().id, this.user, updatedProgram)
      .then(() => {
        this.dialogRef.close({ success: true, operation: 'updated' });
      })
      .catch((err: Error) => {
        logEvent(this.analytics, 'error', {
          component: this.constructor.name,
          action: 'updateProgram',
          message: err.message,
        });
        this.snackBar.open('Error updating program', 'Close');
        this.editProgramForm.enable();
      });
  }

  deleteProgram(): void {
    const dialogConfig = {
      data: {
        operation: 'Delete',
        target: `program: ${this.selectedProgram().name}`,
      },
    };
    const dialogRef = this.dialog.open(DeleteDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.programService
          .deleteProgram(this.selectedProgram().id)
          .then((res) => {
            if (res?.name === 'Error') {
              this.snackBar.open(res.message, 'Close');
            } else {
              this.dialogRef.close({ success: true, operation: 'deleted' });
            }
          })
          .catch((err: Error) => {
            logEvent(this.analytics, 'error', {
              component: this.constructor.name,
              action: 'deleteProgram',
              message: err.message,
            });
            this.snackBar.open(
              'Something went wrong - could not delete program.',
              'Close'
            );
          });
      }
    });
  }
}
