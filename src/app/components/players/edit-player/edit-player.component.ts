import { CommonModule } from '@angular/common';
import { Component, inject, Signal } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
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
import { Team } from '@models/team';
import { GuardianService } from '@services/guardian.service';
import { PlayerService } from '@services/player.service';
import { TeamService } from '@services/team.service';
import { DeleteDialogComponent } from '@shared/delete-dialog/delete-dialog.component';
import { FormatPhoneDirective } from '@shared/directives/format-phone.directive';
import { Coach, Gender, Goalie, TShirtSize } from '@shared/enums';
import { AddPlayerComponent } from '../add-player/add-player.component';
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
  MatDialog,
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
  dialogRef = inject(MatDialogRef<AddPlayerComponent>);
  fb = inject(FormBuilder);
  playerService = inject(PlayerService);
  guardianService = inject(GuardianService);
  teamService = inject(TeamService);
  snackBar = inject(MatSnackBar);
  analytics = inject(Analytics);
  dialog = inject(MatDialog);
  data = inject(MAT_DIALOG_DATA);
  player: Player = this.data.player;

  teams: Signal<Team[]> = this.teamService.currentProgramTeams;

  genderOptions = Object.values(Gender);
  goalieOptions = Object.values(Goalie);
  coachOptions = Object.values(Coach);
  tShirtSizes = Object.values(TShirtSize);

  playerForm = this.fb.group({
    firstName: [this.player.firstName, Validators.required],
    lastName: [this.player.lastName, Validators.required],
    gender: [this.player.gender, Validators.required],
    pronouns: [this.player.pronouns],
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
      {
        value: this.player.jerseyNumber,
        disabled: this.player.programRef === null,
      },
      Validators.pattern('^[0-9]{1,3}$'),
    ],
    teamId: [
      {
        value: this.player.teamRef?.id,
        disabled: this.player.programRef === null,
      },
    ],
    guardians: this.fb.array(
      this.player.guardians.map((guardian) =>
        this.fb.group({
          id: [guardian.id],
          firstName: [guardian.firstName, Validators.required],
          lastName: [guardian.lastName, Validators.required],
          email: [guardian.email, [Validators.email]],
          phone: [
            guardian.phone,
            [Validators.pattern('^[0-9]{3}-?[0-9]{3}-?[0-9]{4}$')],
          ],
          coachManager: [guardian.availableCoachRole, Validators.required],
        })
      ),
      [Validators.required, Validators.minLength(1)]
    ),
  });

  createGuardianFormGroup(): FormGroup {
    return this.fb.group({
      id: [''],
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
    const playerData = this.playerForm.value;
    let guardians = [];
    playerData.guardians.forEach((guardianForm: any) => {
      guardians.push({
        id: guardianForm.id,
        firstName: guardianForm.firstName,
        lastName: guardianForm.lastName,
        email: guardianForm.email,
        phone: guardianForm.phone,
        availableCoachRole: guardianForm.coachManager,
      });
    });
    const player: Partial<Player> = {
      firstName: playerData.firstName,
      lastName: playerData.lastName,
      gender: playerData.gender,
      pronouns: playerData.pronouns,
      birthDate: playerData.birthDate as unknown as Timestamp,
      address: {
        street1: playerData.street1,
        street2: playerData.street2,
        city: playerData.city,
        state: playerData.state,
        zipCode: playerData.zipCode,
      },
      goalie: playerData.goalie,
      usaHockeyNumber: playerData.usaHockeyNumber,
      tShirtSize: playerData.tShirtSize,
      importantInfo: playerData.importantInfo,
      tryoutNumber: playerData.tryoutNumber,
      jerseyNumber: playerData.jerseyNumber,
      programRef: this.player.programRef,
    };
    this.playerService
      .updatePlayer(
        this.player.id,
        player,
        guardians,
        !!playerData.teamId ? playerData.teamId : ''
      )
      .then(() => {
        this.dialogRef.close({
          success: true,
          operation: 'updated',
        });
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
    const dialogConfig = {
      data: {
        operation: 'Delete',
        target: `player: ${this.player.fullName}`,
      },
    };
    const deleteDialogRef = this.dialog.open(
      DeleteDialogComponent,
      dialogConfig
    );
    deleteDialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.playerService
          .deletePlayer(this.player.id)
          .then((res) => {
            if (res?.name === 'Error') {
              this.snackBar.open(res.message, 'Close');
            } else {
              this.dialogRef.close({
                success: true,
                operation: 'deleted',
              });
            }
          })
          .catch((err: Error) => {
            logEvent(this.analytics, 'error', {
              component: this.constructor.name,
              action: 'deletePlayer',
              message: err.message,
            });
            this.snackBar.open(err.message, 'Close');
          });
      }
    });
  }
}
