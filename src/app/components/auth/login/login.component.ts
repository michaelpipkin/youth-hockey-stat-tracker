import { Auth, signInWithPopup } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import {
  Component,
  ElementRef,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
} from 'firebase/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
})
export class LoginComponent {
  auth = inject(Auth);
  router = inject(Router);
  fb = inject(FormBuilder);
  snackbar = inject(MatSnackBar);

  step1Complete = signal<boolean>(false);
  step2Complete = signal<boolean>(false);
  hidePassword = model<boolean>(true);
  newAccount = model<boolean>(false);
  passwordField = viewChild<ElementRef>('passwordInput');

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  passwordForm = this.fb.group({
    password: ['', Validators.required],
  });

  toggleHidePassword() {
    this.hidePassword.update((h) => !h);
  }

  get e() {
    return this.emailForm.controls;
  }

  get p() {
    return this.passwordForm.controls;
  }

  emailLogin() {
    this.step1Complete.set(true);
  }

  async checkEmail() {
    const email = this.emailForm.value.email;
    const signInMethods = await fetchSignInMethodsForEmail(this.auth, email);
    if (signInMethods.length === 0) {
      // New user
      this.newAccount.set(true);
    }
    this.step2Complete.set(true);
    this.emailForm.get('email')?.disable();
  }

  resetForm() {
    this.emailForm.reset();
    this.passwordForm.reset();
    this.emailForm.get('email')?.enable();
    this.emailForm.get('email')?.setErrors(null);
    this.emailForm.get('email')?.markAsPristine();
    this.emailForm.get('email')?.markAsUntouched();
    this.step1Complete.set(false);
    this.step2Complete.set(false);
    this.newAccount.set(false);
  }

  async emailPasswordLogin() {
    const email = this.emailForm.value.email;
    const password = this.passwordForm.value.password;
    if (this.newAccount()) {
      await createUserWithEmailAndPassword(this.auth, email, password)
        .then((userCredential) => {
          this.router.navigateByUrl('/programs');
        })
        .catch((error) => {
          this.snackbar.open(error.message, 'Close');
        });
    } else {
      await signInWithEmailAndPassword(this.auth, email, password)
        .then((userCredential) => {
          this.router.navigateByUrl('/programs');
        })
        .catch((error) => {
          this.snackbar.open(error.message, 'Close');
        });
    }
  }

  googleLogin() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.auth, provider)
      .then((userCredential) => {
        this.router.navigateByUrl('/programs');
      })
      .catch((error) => {
        this.snackbar.open(error.message, 'Close');
      });
  }

  onLoginSuccess() {
    this.router.navigateByUrl('/programs');
  }
}
