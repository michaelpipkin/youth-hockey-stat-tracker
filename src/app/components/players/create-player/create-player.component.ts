import { CommonModule } from '@angular/common';
import { Component, inject, model } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { User } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Address } from '@models/address';
import { Guardian } from '@models/guardian';
import { Player } from '@models/player';
import { Program } from '@models/program';
import { PlayerService } from '@services/player.service';
import { FormatPhoneDirective } from '@shared/directives/format-phone.directive';
import { Coach, Gender, Goalie, TShirtSize } from '@shared/enums';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-create-player',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatTooltipModule,
    FormatPhoneDirective,
    MatCheckboxModule,
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
  data = inject(MAT_DIALOG_DATA);
  user: User = this.data.user;
  program: Program = this.data.program;

  genderOptions = Object.values(Gender);
  goalieOptions = Object.values(Goalie);
  coachOptions = Object.values(Coach);
  tShirtSizes = Object.values(TShirtSize);

  playerForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    gender: [null, Validators.required],
    birthDate: [null, Validators.required],
    street1: ['', Validators.required],
    street2: [''],
    city: ['', Validators.required],
    state: ['', [Validators.required, Validators.pattern('^[A-Z]{2}$')]],
    zipCode: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]],
    usaHockeyNumber: ['', Validators.required],
    goalie: [Goalie.N, Validators.required],
    tShirtSize: [TShirtSize.U, Validators.required],
    importantInfo: [''],
    addToProgram: true,
    guardians: this.fb.array(
      [this.createGuardianFormGroup()],
      [Validators.required, Validators.minLength(1)]
    ),
  });

  createGuardianFormGroup(): FormGroup {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern('^[0-9]{3}-?[0-9]{3}-?[0-9]{4}$')]],
      coachManager: [Coach.N, Validators.required],
    });
  }

  get guardiansFormArray(): FormArray {
    return this.playerForm.get('guardians') as FormArray;
  }

  addGuardian(): void {
    this.guardiansFormArray.push(this.createGuardianFormGroup());
  }

  removeGuardian(index: number): void {
    this.guardiansFormArray.removeAt(index);
  }

  public get f() {
    return this.playerForm.controls;
  }

  onSubmit(): void {
    this.playerForm.disable();
    const formValues = this.playerForm.value;
    let guardians = [];
    formValues.guardians.forEach((guardianForm: any) => {
      guardians.push({
        firstName: guardianForm.firstName,
        lastName: guardianForm.lastName,
        email: guardianForm.email,
        phone: guardianForm.phone,
        coachManager: guardianForm.coachManager,
      });
    });
    const newPlayer: Partial<Player> = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      gender: formValues.gender,
      birthDate: formValues.birthDate,
      address: {
        street1: formValues.street1,
        street2: formValues.street2,
        city: formValues.city,
        state: formValues.state,
        zipCode: formValues.zipCode,
      },
      goalie: formValues.goalie,
      usaHockeyNumber: formValues.usaHockeyNumber,
      tShirtSize: formValues.tShirtSize,
      importantInfo: formValues.importantInfo,
      guardians: guardians,
      programId: formValues.addToProgram ? this.program.id : '',
      active: true,
    };
    this.playerService
      .createPlayer(newPlayer)
      .then(() => {
        this.dialogRef.close(true);
      })
      .catch((err: Error) => {
        logEvent(this.analytics, 'error', {
          component: this.constructor.name,
          action: 'createPlayer',
          message: err.message,
        });
        this.snackBar.open('Error creating player', 'Close', {
          verticalPosition: 'top',
        });
        this.playerForm.enable();
      });
  }
}
