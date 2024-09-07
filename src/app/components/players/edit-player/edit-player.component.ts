import { CommonModule } from '@angular/common';
import { Component, inject, Signal } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { User } from '@angular/fire/auth';
import { Timestamp } from '@angular/fire/firestore';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Player } from '@models/player';
import { Program } from '@models/program';
import { Team } from '@models/team';
import { PlayerService } from '@services/player.service';
import { TeamService } from '@services/team.service';
import { FormatPhoneDirective } from '@shared/directives/format-phone.directive';
import { Coach, Gender, Goalie, TShirtSize } from '@shared/enums';
import { CreatePlayerComponent } from '../create-player/create-player.component';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  FormArray,
} from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

@Component({
  selector: 'app-edit-player',
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
  templateUrl: './edit-player.component.html',
  styleUrl: './edit-player.component.scss',
})
export class EditPlayerComponent {
  dialogRef = inject(MatDialogRef<CreatePlayerComponent>);
  fb = inject(FormBuilder);
  playerService = inject(PlayerService);
  teamService = inject(TeamService);
  snackBar = inject(MatSnackBar);
  analytics = inject(Analytics);
  data = inject(MAT_DIALOG_DATA);
  player: Player = this.data.player;
  user: User = this.data.user;
  program: Program = this.data.program;

  teams: Signal<Team[]> = this.teamService.currentProgramTeams;

  genderOptions = Object.values(Gender);
  goalieOptions = Object.values(Goalie);
  coachOptions = Object.values(Coach);
  tShirtSizes = Object.values(TShirtSize);

  playerForm = this.fb.group({
    firstName: [this.player.firstName, Validators.required],
    lastName: [this.player.lastName, Validators.required],
    gender: [this.player.gender, Validators.required],
    birthDate: [this.player.birthDate.toDate(), Validators.required],
    street1: [this.player.address.street1, Validators.required],
    street2: [this.player.address.street2],
    city: [this.player.address.city, Validators.required],
    state: [
      this.player.address.state,
      [Validators.required, Validators.pattern('^[A-Z]{2}$')],
    ],
    zipCode: [
      this.player.address.zipCode,
      [Validators.required, Validators.pattern('^[0-9]{5}$')],
    ],
    usaHockeyNumber: [this.player.usaHockeyNumber, Validators.required],
    goalie: [this.player.goalie, Validators.required],
    tShirtSize: [this.player.tShirtSize, Validators.required],
    importantInfo: [this.player.importantInfo],
    tryoutNumber: [
      this.player.tryoutNumber,
      Validators.pattern('^[0-9]{1,3}$'),
    ],
    jerseyNumber: [
      this.player.jerseyNumber,
      Validators.pattern('^[0-9]{1,3}$'),
    ],
    teamId: [this.player.teamId],
    guardians: this.fb.array(
      this.player.guardians.map((guardian) =>
        this.fb.group({
          firstName: [guardian.firstName, Validators.required],
          lastName: [guardian.lastName, Validators.required],
          email: [guardian.email, [Validators.email]],
          phone: [
            guardian.phone,
            [Validators.pattern('^[0-9]{3}-?[0-9]{3}-?[0-9]{4}$')],
          ],
          coachManager: [guardian.coachManager, Validators.required],
        })
      ),
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
    this.playerForm.markAsDirty();
  }

  removeGuardian(index: number): void {
    this.guardiansFormArray.removeAt(index);
    this.playerForm.markAsDirty();
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
    const player: Partial<Player> = {
      id: this.player.id,
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      gender: formValues.gender,
      birthDate: formValues.birthDate as unknown as Timestamp,
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
      programId: this.program.id,
      teamId: formValues.teamId,
      tryoutNumber: formValues.tryoutNumber,
      jerseyNumber: formValues.jerseyNumber,
    };
    this.playerService
      .updatePlayer(player)
      .then(() => {
        this.dialogRef.close(true);
      })
      .catch((err: Error) => {
        logEvent(this.analytics, 'error', {
          component: this.constructor.name,
          action: 'updatePlayer',
          message: err.message,
        });
        this.snackBar.open(err.message, 'Close', {
          verticalPosition: 'top',
        });
        this.playerForm.enable();
      });
  }

  deletePlayer(): void {
    // TO-DO: Implement delete player functionality
  }
}
