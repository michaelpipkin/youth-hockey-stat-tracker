import { Component, inject, model, Signal } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { User } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Program } from '@models/program';
import { ProgramService } from '@services/program.service';
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
  inputData: any = inject(MAT_DIALOG_DATA);
  user: User = this.inputData.user;

  userPrograms: Signal<Program[]> = this.programService.userPrograms;

  selectedProgram = model<Program>(null);

  editProgramForm = this.fb.group({
    name: [{ value: '', disabled: true }, Validators.required],
    description: { value: '', disabled: true },
  });

  public get f() {
    return this.editProgramForm.controls;
  }

  onSelectProgram(): void {
    this.editProgramForm.patchValue({
      name: this.selectedProgram().name,
      description: this.selectedProgram().description,
    });
    this.f.name.enable();
    this.f.description.enable();
  }

  onSubmit(): void {
    this.editProgramForm.disable();
    const formValues = this.editProgramForm.value;
    const updatedProgram: Partial<Program> = {
      id: this.selectedProgram().id,
      ownerId: this.user.uid,
      name: formValues.name,
      description: formValues.description,
    };
    this.programService
      .updateProgram(updatedProgram)
      .then(() => {
        this.dialogRef.close({ success: true, operation: 'update' });
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
}
