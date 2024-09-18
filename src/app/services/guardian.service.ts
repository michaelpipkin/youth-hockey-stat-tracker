import { inject, Injectable, signal } from '@angular/core';
import { Guardian } from '@models/guardian';
import {
  addDoc,
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class GuardianService {
  fs = inject(Firestore);

  currentPlayerGuardians = signal<Guardian[]>([]);
  currentTeamGuardians = signal<Guardian[]>([]);

  async getPlayerGuardians(playerId: string): Promise<void> {
    const playerRef = doc(this.fs, `players/${playerId}`);
    const guardiansQuery = query(
      collection(this.fs, `guardians`),
      where('players', 'array-contains', playerRef)
    );
    onSnapshot(guardiansQuery, (snapshot) => {
      this.currentPlayerGuardians.set(
        snapshot.docs.map((doc) => new Guardian({ id: doc.id, ...doc.data() }))
      );
    });
  }

  async getTeamGuardians(programId: string, teamId: string): Promise<void> {
    const teamRef = doc(this.fs, `programs/${programId}/teams/${teamId}`);
    const playerQuery = query(
      collection(this.fs, 'players'),
      where('team', '==', teamRef)
    );
    onSnapshot(playerQuery, (snapshot) => {
      const playerRefs = snapshot.docs.map((doc) => doc.ref);
      const guardiansQuery = query(
        collection(this.fs, 'guardians'),
        where('players', 'array-contains-any', playerRefs)
      );
      onSnapshot(guardiansQuery, (guardianSnapshot) => {
        this.currentTeamGuardians.set(
          guardianSnapshot.docs.map(
            (doc) => new Guardian({ id: doc.id, ...doc.data() })
          )
        );
      });
    });
  }

  async getGuardian(guardianId: string): Promise<Guardian> {
    const guardianDoc = doc(this.fs, `guardians/${guardianId}`);
    const guardianSnapshot = await getDoc(guardianDoc);
    return new Guardian({
      id: guardianSnapshot.id,
      ...guardianSnapshot.data(),
    });
  }

  async addGuardian(
    guardian: Partial<Guardian>,
    playerId: string
  ): Promise<any> {
    const playerRef = doc(this.fs, `players/${playerId}`);
    const guardianCollection = collection(this.fs, 'guardians');
    if (guardian.email === '') {
      guardian.players = [playerRef];
      return await addDoc(guardianCollection, guardian);
    }
    const guardianQuery = query(
      guardianCollection,
      where('email', '==', guardian.email),
      limit(1)
    );
    return await getDocs(guardianQuery).then(async (snapshot) => {
      if (!snapshot.empty) {
        const guardianRef = snapshot.docs[0].ref;
        const updatedGuardian = snapshot.docs[0].data();
        updatedGuardian.players.push(playerRef);
        return await updateDoc(guardianRef, updatedGuardian);
      } else {
        guardian.players = [playerRef];
        return await addDoc(guardianCollection, guardian);
      }
    });
  }
}
