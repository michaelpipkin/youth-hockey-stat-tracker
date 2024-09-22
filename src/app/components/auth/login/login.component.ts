import { Component, inject } from '@angular/core';
import { Auth, signInWithPopup } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { EmailAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import * as firebaseui from 'firebaseui';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [MatButtonModule],
})
export class LoginComponent {
  ui: firebaseui.auth.AuthUI;

  auth = inject(Auth);
  router = inject(Router);

  googleLogin() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.auth, provider)
      .then((userCredential) => {
        this.router.navigateByUrl('/programs');
      })
      .catch((error) => {
        // Handle Google login error
      });
  }

  ngOnInit(): void {
    const uiConfig = {
      callbacks: {
        signInSuccessWithAuthResult: function () {
          return true;
        },
      },
      signInSuccessUrl: '/programs',
      signInOptions: [
        {
          provider: EmailAuthProvider.PROVIDER_ID,
          requireDisplayName: false,
        },
      ],
    };
    this.ui = new firebaseui.auth.AuthUI(this.auth);
    this.ui.start('#firebaseui-auth-container', uiConfig);
    this.ui.disableAutoSignIn();
  }

  ngOnDestroy(): void {
    this.ui.delete();
  }

  onLoginSuccess() {
    this.router.navigateByUrl('/programs');
  }
}
