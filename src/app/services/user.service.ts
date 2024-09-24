import { computed, inject, Injectable, signal } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { AppUser } from '@models/user';
import { UserType } from '@shared/enums';
import { LoadingService } from '@shared/loading/loading.service';
import { ProgramService } from './program.service';
import {
  collection,
  doc,
  documentId,
  Firestore,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  user = signal<AppUser>(null);
  userList = signal<AppUser[]>([]);
  isLoggedIn = computed<boolean>(() => !!this.user());
  isApproved = computed<boolean>(() => this.user()?.approved);
  isDirector = computed<boolean>(() => this.user()?.userType === UserType.D);

  fs = inject(Firestore);
  loading = inject(LoadingService);
  router = inject(Router);
  auth = inject(Auth);
  programService = inject(ProgramService);

  constructor() {
    this.auth.onAuthStateChanged(async (fbUser) => {
      if (!!fbUser) {
        this.loading.loadingOn();
        return await this.getUser(fbUser).then(() => {
          this.programService.getUserPrograms(fbUser.uid, this.isDirector());
          this.router.navigateByUrl('/programs');
          this.loading.loadingOff();
          return true;
        });
      } else {
        this.user.set(null);
        return false;
      }
    });
  }

  async addUser(userId: string, user: Partial<AppUser>): Promise<any> {
    const userDoc = doc(this.fs, `users/${userId}`);
    const userSnapshot = await getDoc(userDoc);
    if (!userSnapshot.exists()) {
      return await setDoc(userDoc, user);
    } else {
      return await setDoc(
        userDoc,
        {
          displayName: user.displayName,
          email: user.email,
        },
        { merge: true }
      );
    }
  }

  async updateUser(userId: string, user: Partial<AppUser>): Promise<any> {
    if (userId === this.user().id && user.approved === false) {
      throw new Error('You cannot unapprove yourself.');
    }
    const userDoc = doc(this.fs, `users/${userId}`);
    const usersCollection = collection(this.fs, 'users');
    const usersQuery = query(
      usersCollection,
      where('userType', '==', UserType.D),
      where('approved', '==', true),
      where(documentId(), '!=', userId)
    );
    const snapshot = await getDocs(usersQuery);
    if (snapshot.empty) {
      throw new Error('At least one active director is required.');
    }
    return await updateDoc(userDoc, user);
  }

  async getUser(fbUser: User): Promise<void> {
    const userDoc = doc(this.fs, `users/${fbUser.uid}`);
    const userSnapshot = await getDoc(userDoc);
    this.user.set(
      new AppUser({
        id: fbUser.uid,
        email: fbUser.email,
        ...userSnapshot.data(),
      })
    );
  }

  async getAllUsers(): Promise<void> {
    const usersCollection = collection(this.fs, 'users');
    const usersQuery = query(usersCollection, orderBy('displayName', 'asc'));
    onSnapshot(usersQuery, (snapshot) => {
      this.userList.set(
        snapshot.docs.map((doc) => new AppUser({ id: doc.id, ...doc.data() }))
      );
    });
  }

  logout() {
    this.auth.signOut().finally(() => this.router.navigateByUrl('/login'));
  }
}
