import { inject, Injectable, signal } from '@angular/core';
import { Player } from '@models/player';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  Firestore,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  fs = inject(Firestore);

  currentProgramPlayers = signal<Player[]>([]);

  async getProgramPlayers(programId: string): Promise<void> {
    const playerQuery = query(
      collection(this.fs, `players`),
      where('programId', 'in', [programId, '']),
      orderBy('lastName', 'asc'),
      orderBy('firstName', 'asc')
    );
    onSnapshot(playerQuery, (snapshot) => {
      this.currentProgramPlayers.set(
        snapshot.docs.map((doc) => new Player({ id: doc.id, ...doc.data() }))
      );
    });
  }

  async getTeamPlayers(teamId: string): Promise<void> {
    const playerQuery = query(
      collection(this.fs, `players`),
      where('teamId', '==', teamId),
      orderBy('lastName', 'asc'),
      orderBy('firstName', 'asc')
    );
    onSnapshot(playerQuery, (snapshot) => {
      this.currentProgramPlayers.set(
        snapshot.docs.map((doc) => new Player({ id: doc.id, ...doc.data() }))
      );
    });
  }

  async getPlayer(playerId: string): Promise<Player> {
    const playerDoc = await getDoc(doc(this.fs, `players/${playerId}`));
    return new Player({ id: playerDoc.id, ...playerDoc.data() });
  }

  async createPlayer(player: Partial<Player>): Promise<any> {
    const c = collection(this.fs, 'players');
    const q = query(
      c,
      where('firstName', '==', player.firstName),
      where('lastName', '==', player.lastName),
      where('birthDate', '==', player.birthDate)
    );
    return await getDocs(q).then(async (snapshot) => {
      if (!snapshot.empty) {
        throw new Error('Player already exists');
      } else {
        return await addDoc(c, player);
      }
    });
  }

  async updatePlayer(player: Partial<Player>): Promise<any> {
    const c = collection(this.fs, 'players');
    const q = query(
      c,
      where('firstName', '==', player.firstName),
      where('lastName', '==', player.lastName),
      where('birthDate', '==', player.birthDate),
      where(documentId(), '!=', player.id)
    );
    return await getDocs(q).then(async (snapshot) => {
      if (!snapshot.empty) {
        return new Error(
          'A player with this name and birth date already exists.'
        );
      }
      return await updateDoc(doc(this.fs, `players/${player.id}`), player);
    });
  }

  async deletePlayer(playerId: string): Promise<any> {
    const playerDoc = await getDoc(doc(this.fs, `players/${playerId}`));
    const player = new Player({ id: playerDoc.id, ...playerDoc.data() });
    if (player.programId !== null || player.teamId !== null) {
      return new Error('Cannot delete a player assigned to a program or team.');
    } else {
      return await deleteDoc(doc(this.fs, `players/${playerId}`));
    }
  }

  async addPlayersToProgram(
    programId: string,
    playerIds: string[]
  ): Promise<any> {
    const batch = writeBatch(this.fs);
    playerIds.forEach((playerId) => {
      const playerRef = doc(this.fs, `players/${playerId}`);
      batch.update(playerRef, { programId: programId });
    });
    return await batch
      .commit()
      .then(() => {
        return true;
      })
      .catch((err: Error) => {
        return new Error(err.message);
      });
  }

  async clearProgramPlayers(programId: string): Promise<any> {
    const batch = writeBatch(this.fs);
    const playerQuery = query(
      collection(this.fs, 'players'),
      where('programId', '==', programId)
    );
    await getDocs(playerQuery).then((snapshot) => {
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { programId: '', teamId: '' });
      });
    });
    return await batch
      .commit()
      .then(() => {
        return true;
      })
      .catch((err: Error) => {
        return new Error(err.message);
      });
  }

  async clearTeamPlayers(teamId: string): Promise<any> {
    const batch = writeBatch(this.fs);
    const playerQuery = query(
      collection(this.fs, 'players'),
      where('teamId', '==', teamId)
    );
    await getDocs(playerQuery).then((snapshot) => {
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { teamId: '' });
      });
    });
    return await batch
      .commit()
      .then(() => {
        return true;
      })
      .catch((err: Error) => {
        return new Error(err.message);
      });
  }
}
