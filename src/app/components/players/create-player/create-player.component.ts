import { A } from '@angular/cdk/keycodes';
import { Component, inject } from '@angular/core';
import { Analytics } from '@angular/fire/analytics';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlayerService } from '@services/player.service';
import { Gender } from '@shared/enums';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-create-player',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
  ],
  templateUrl: './create-player.component.html',
  styleUrl: './create-player.component.scss',
})
export class CreatePlayerComponent {
  dialogRef = inject(MatDialogRef<CreatePlayerComponent>);
  fb = inject(FormBuilder);
  playerService = inject(PlayerService);
  snackBar = inject(MatSnackBar);
  analytics = inject(Analytics);

  playerForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    gender: [null, Validators.required],
    birthDate: [null, Validators.required],
    street1: ['', Validators.required],
    street2: [''],
    city: ['', Validators.required],
    state: ['', [Validators.required, Validators.pattern('^[A-Z]{2}}$')]],
    zipCode: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]],
  });

  genderOptions = Object.values(Gender);

  public get f() {
    return this.playerForm.controls;
  }

  onSubmit(): void {}
}
