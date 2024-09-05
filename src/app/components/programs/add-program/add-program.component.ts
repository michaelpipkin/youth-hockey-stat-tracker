import { Component, inject } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { User } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

@Component({
  selector: 'app-add-program',
  standalone: true,
  imports: [
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './add-program.component.html',
  styleUrl: './add-program.component.scss',
})
export class AddProgramComponent {
  dialogRef = inject(MatDialogRef<AddProgramComponent>);
  fb = inject(FormBuilder);
  programService = inject(ProgramService);
  snackBar = inject(MatSnackBar);
  analytics = inject(Analytics);
  inputData: any = inject(MAT_DIALOG_DATA);
  user: User = this.inputData.user;

  newProgramForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  public get f() {
    return this.newProgramForm.controls;
  }

  onSubmit(): void {
    this.newProgramForm.disable();
    const formValues = this.newProgramForm.value;
    const newProgram: Partial<Program> = {
      ownerId: this.user.uid,
      name: formValues.name,
      description: formValues.description,
      active: this.programService.userPrograms().length === 0,
    };
    this.programService
      .addProgram(newProgram)
      .then(() => {
        this.dialogRef.close(true);
      })
      .catch((err: Error) => {
        logEvent(this.analytics, 'error', {
          component: this.constructor.name,
          action: 'addProgram',
          message: err.message,
        });
        this.snackBar.open('Error adding program', 'Close', {
          verticalPosition: 'top',
        });
        this.newProgramForm.enable();
      });
  }
}
