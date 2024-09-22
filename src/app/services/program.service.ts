import { computed, inject, Injectable, signal } from '@angular/core';
import { Program } from '@models/program';
import { EvaluationService } from './evaluation.service';
import { PlayerService } from './player.service';
import { TeamService } from './team.service';
import {
  addDoc,
  collection,
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
export class ProgramService {
  fs = inject(Firestore);
  playerService = inject(PlayerService);
  teamService = inject(TeamService);
  evaluationService = inject(EvaluationService);

  userPrograms = signal<Program[]>([]);

  activeUserProgram = computed(() => {
    const activeProgram = this.userPrograms().find((p) => p.active);
    if (!activeProgram) {
      return null;
    }
    this.playerService.getProgramPlayers(activeProgram.id);
    this.teamService.getProgramTeams(activeProgram.id);
    this.evaluationService.getEvaluations(activeProgram.id);
    return activeProgram;
  });

  getUserPrograms(userId: string): void {
    const programQuery = query(
      collection(this.fs, 'programs'),
      where('ownerId', '==', userId),
      orderBy('name', 'asc')
    );
    onSnapshot(programQuery, (snapshot) => {
      this.userPrograms.set(
        snapshot.docs.map((doc) => new Program({ id: doc.id, ...doc.data() }))
      );
    });
  }

  async addProgram(program: Partial<Program>): Promise<any> {
    const c = collection(this.fs, 'programs');
    const q = query(
      c,
      where('name', '==', program.name),
      where('ownerId', '==', program.ownerId)
    );
    return await getDocs(q).then(async (snapshot) => {
      if (!snapshot.empty) {
        throw new Error('You have already created a program with this name.');
      }
      return await addDoc(c, program);
    });
  }

  async updateProgram(
    programId: string,
    program: Partial<Program>
  ): Promise<any> {
    const c = collection(this.fs, 'programs');
    const q = query(
      c,
      where('name', '==', program.name),
      where('ownerId', '==', program.ownerId),
      where(documentId(), '!=', programId)
    );
    return await getDocs(q).then(async (snapshot) => {
      if (!snapshot.empty) {
        throw new Error('A program with this name already exists.');
      }
      return await updateDoc(doc(this.fs, `programs/${programId}`), program);
    });
  }

  async setActiveProgram(userId: string, programId: string): Promise<any> {
    const batch = writeBatch(this.fs);
    const program = await getDoc(doc(this.fs, `programs/${programId}`));
    if (!program.exists) {
      throw new Error('Program does not exist');
    }
    const q = query(
      collection(this.fs, 'programs'),
      where('ownerId', '==', userId),
      where('active', '==', true)
    );
    await getDocs(q).then((snapshot) => {
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { active: false });
      });
    });
    batch.update(doc(this.fs, `programs/${programId}`), { active: true });
    // Commit the batch
    return await batch
      .commit()
      .then(() => {
        return true;
      })
      .catch((err: Error) => {
        throw new Error(err.message);
      });
  }

  async deleteProgram(programId: string): Promise<any> {
    const programRef = doc(this.fs, `programs/${programId}`);
    const teamsQuery = query(
      collection(this.fs, `programs/${programId}/teams`)
    );
    const playersQuery = query(
      collection(this.fs, 'players'),
      where('programRef', '==', programRef)
    );

    const batch = writeBatch(this.fs);

    // Delete all teams under the program
    const teamsSnapshot = await getDocs(teamsQuery);
    teamsSnapshot.forEach((teamDoc) => {
      batch.delete(teamDoc.ref);
    });

    // Update all player documents that refer to the program
    const playersSnapshot = await getDocs(playersQuery);
    playersSnapshot.forEach((playerDoc) => {
      batch.update(playerDoc.ref, { teamRef: null, programRef: null });
    });

    // Delete the program
    batch.delete(programRef);

    // Commit the batch
    return await batch
      .commit()
      .then(() => {
        return true;
      })
      .catch((err: Error) => {
        throw new Error(err.message);
      });
  }

  async resetProgram(programId: string): Promise<any> {
    const programRef = doc(this.fs, `programs/${programId}`);
    const teamsQuery = query(
      collection(this.fs, `programs/${programId}/teams`)
    );
    const playersQuery = query(
      collection(this.fs, 'players'),
      where('programRef', '==', programRef)
    );

    const batch = writeBatch(this.fs);

    // Delete all teams under the program
    const teamsSnapshot = await getDocs(teamsQuery);
    teamsSnapshot.forEach((teamDoc) => {
      batch.delete(teamDoc.ref);
    });

    // Update all player documents that refer to the program
    const playersSnapshot = await getDocs(playersQuery);
    playersSnapshot.forEach((playerDoc) => {
      batch.update(playerDoc.ref, {
        teamRef: null,
        programRef: null,
        jerseyNuumber: '',
        tryoutNumber: '',
        evaluationScore: 0,
        totalLooks: 0,
      });
    });

    // Commit the batch
    return await batch
      .commit()
      .then(() => {
        return true;
      })
      .catch((err: Error) => {
        throw new Error(err.message);
      });
  }
}
