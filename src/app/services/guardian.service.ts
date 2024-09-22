import { inject, Injectable, signal } from '@angular/core';
import { Guardian } from '@models/guardian';
import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class GuardianService {
  fs = inject(Firestore);

  currentTeamGuardians = signal<Guardian[]>([]);

  async getGuardian(playerId: string, guardianId: string): Promise<Guardian> {
    const guardianDoc = doc(
      this.fs,
      `players/${playerId}/guardians/${guardianId}`
    );
    const guardianSnapshot = await getDoc(guardianDoc);
    return new Guardian({
      id: guardianSnapshot.id,
      ...guardianSnapshot.data(),
    });
  }

  async getPlayerGuardians(playerId: string): Promise<Guardian[]> {
    const guardiansCollection = collection(
      this.fs,
      `players/${playerId}/guardians`
    );
    return await getDocs(guardiansCollection).then((snapshot) => {
      return snapshot.docs.map(
        (doc) => new Guardian({ id: doc.id, ...doc.data() })
      );
    });
  }

  async getTeamGuardians(programId: string, teamId: string): Promise<void> {
    // Reference to the specific team document in Firestore
    const teamRef = doc(this.fs, `programs/${programId}/teams/${teamId}`);

    // Query to get all players that belong to the specified team
    const playerQuery = query(
      collection(this.fs, 'players'),
      where('team', '==', teamRef)
    );

    // Listen for real-time updates to the players collection
    onSnapshot(playerQuery, async (playerSnapshots) => {
      // For each player, fetch their guardians
      const guardianPromises = playerSnapshots.docs.map(async (playerDoc) => {
        const guardiansCollection = collection(
          this.fs,
          `players/${playerDoc.id}/guardians`
        );
        const guardianSnapshots = await getDocs(guardiansCollection);
        return guardianSnapshots.docs.map(
          (doc) => new Guardian({ id: doc.id, ...doc.data() })
        );
      });

      // Wait for all guardian fetch promises to resolve
      const guardiansArrays = await Promise.all(guardianPromises);

      // Flatten the array of guardian arrays into a single array
      const guardians = guardiansArrays.flat();

      // Update the currentTeamGuardians signal with the fetched guardians
      this.currentTeamGuardians.set(guardians);
    });
  }
}
