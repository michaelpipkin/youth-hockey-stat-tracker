import { Analytics, logEvent } from '@angular/fire/analytics';
import { Auth } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppUser } from '@models/user';
import { UserService } from '@services/user.service';
import { LoadingService } from '@shared/loading/loading.service';
import * as firebase from 'firebase/auth';
import { environment } from 'src/environments/environment';
import {
  Component,
  effect,
  inject,
  model,
  OnInit,
  Signal,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
})
export class ProfileComponent implements OnInit {
  fb = inject(FormBuilder);
  auth = inject(Auth);
  userService = inject(UserService);
  loading = inject(LoadingService);
  snackBar = inject(MatSnackBar);
  analytics = inject(Analytics);

  appUser: Signal<AppUser> = this.userService.user;

  firebaseUser = signal<firebase.User>(this.auth.currentUser);
  prod = signal<boolean>(environment.production);

  hidePassword = model<boolean>(true);
  hideConfirm = model<boolean>(true);
  googleOnlyUser = model<boolean>(false);

  //TODO: Update form to allow for updating first and last name
  emailForm = this.fb.group({
    email: [this.firebaseUser()?.email, Validators.email],
  });
  displayNameForm = this.fb.group({
    displayName: [this.appUser()?.displayName, Validators.required],
  });
  passwordForm = this.fb.group(
    {
      password: '',
      confirmPassword: '',
    },
    { validators: this.passwordMatchValidator }
  );

  constructor() {
    effect(() => {
      this.displayNameForm.patchValue({
        displayName: this.appUser()?.displayName,
      });
    });
  }

  ngOnInit(): void {
    this.userService.getUser(this.auth.currentUser);
    if (
      this.auth.currentUser.providerData.length === 1 &&
      this.auth.currentUser.providerData[0].providerId === 'google.com'
    ) {
      this.googleOnlyUser.set(true);
    }
  }

  get d() {
    return this.displayNameForm.controls;
  }

  get e() {
    return this.emailForm.controls;
  }

  toggleHidePassword() {
    this.hidePassword.update((h) => !h);
  }

  toggleHideConfirm() {
    this.hideConfirm.update((h) => !h);
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password').value === g.get('confirmPassword').value
      ? null
      : { mismatch: true };
  }

  async verifyEmail(): Promise<void> {
    firebase
      .sendEmailVerification(this.firebaseUser())
      .then(() => {
        this.snackBar.open(
          'Check your email to verify your email address.',
          'Close',
          {
            verticalPosition: 'top',
          }
        );
      })
      .catch((err: Error) => {
        logEvent(this.analytics, 'error', {
          component: this.constructor.name,
          action: 'verify_email',
          message: err.message,
        });
        this.snackBar.open(
          'Something went wrong - verification email could not be sent.',
          'Close',
          {
            verticalPosition: 'top',
          }
        );
      });
  }

  onSubmitEmail(): void {
    this.emailForm.disable();
    const newEmail = this.emailForm.value.email;
    if (newEmail !== this.firebaseUser().email) {
      this.loading.loadingOn();
      firebase
        .updateEmail(this.firebaseUser(), newEmail)
        .then(async () => {
          await this.userService
            .updateUser(this.appUser().id, { email: newEmail })
            .then(() => {
              this.snackBar.open(
                'Your email address has been updated.',
                'Close',
                {
                  verticalPosition: 'top',
                }
              );
            });
        })
        .catch((err) => {
          logEvent(this.analytics, 'error', {
            component: this.constructor.name,
            action: 'update_email',
            message: err.message,
          });
          if (err.code === 'auth/email-already-in-use') {
            this.snackBar.open(
              'This email address is already in use by another account.',
              'Close',
              {
                verticalPosition: 'top',
              }
            );
          } else {
            this.snackBar.open(
              'Something went wrong - your email address could not be updated.',
              'Close',
              {
                verticalPosition: 'top',
              }
            );
          }
        })
        .finally(() => {
          this.loading.loadingOff();
        });
    }
    this.emailForm.enable();
  }

  onSubmitDisplayName(): void {
    this.displayNameForm.disable();
    const newDisplayName = this.displayNameForm.value.displayName;
    if (newDisplayName !== this.appUser().displayName) {
      this.loading.loadingOn();
      this.userService
        .updateUser(this.appUser().id, { displayName: newDisplayName })
        .then(() => {
          this.displayNameForm.markAsPristine();
          this.snackBar.open('Your display name has been updated.', 'Close');
        })
        .catch((err) => {
          logEvent(this.analytics, 'error', {
            component: this.constructor.name,
            action: 'update_display_name',
            message: err.message,
          });
          this.snackBar.open(
            'Something went wrong - your display name could not be updated.',
            'Close'
          );
        })
        .finally(() => {
          this.loading.loadingOff();
        });
    }
    this.displayNameForm.enable();
  }

  onSubmitPassword(): void {
    this.passwordForm.disable();
    const changes = this.passwordForm.value;
    if (changes.password !== '') {
      firebase
        .updatePassword(this.firebaseUser(), changes.password)
        .then(() => {
          this.snackBar.open('Your password has been updated.', 'Close', {
            verticalPosition: 'top',
          });
        })
        .catch(() => {
          this.snackBar.open(
            'Something went wrong - your password could not be updated.',
            'Close',
            {
              verticalPosition: 'top',
            }
          );
        });
    }
    this.passwordForm.enable();
  }
}
