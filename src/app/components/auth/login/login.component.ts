import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { EmailAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import * as firebaseui from 'firebaseui';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
})
export class LoginComponent implements OnInit, OnDestroy {
  ui: firebaseui.auth.AuthUI;

  auth = inject(Auth);
  router = inject(Router);

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
        {
          provider: GoogleAuthProvider.PROVIDER_ID,
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
