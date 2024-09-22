import { computed, inject, Injectable, signal } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { ProgramService } from './program.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  user = signal<User>(null);
  isLoggedIn = computed(() => !!this.user());

  fs = inject(Firestore);
  router = inject(Router);
  auth = inject(Auth);
  programService = inject(ProgramService);

  constructor() {
    this.auth.onAuthStateChanged((firebaseUser) => {
      if (!!firebaseUser) {
        this.user.set(firebaseUser);
        this.programService.getUserPrograms(firebaseUser.uid);
        return true;
      } else {
        this.user.set(null);
        return false;
      }
    });
  }

  logout() {
    this.auth.signOut().finally(() => this.router.navigateByUrl('/login'));
  }
}
