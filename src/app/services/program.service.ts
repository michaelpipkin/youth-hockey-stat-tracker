import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Program } from '@models/program';
import { Trade } from '@models/trade';
import { AppUser } from '@models/user';
import { EvaluationService } from './evaluation.service';
import { PlayerService } from './player.service';
import { TeamService } from './team.service';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  Firestore,
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
  router = inject(Router);
  playerService = inject(PlayerService);
  teamService = inject(TeamService);
  evaluationService = inject(EvaluationService);

  userPrograms = signal<Program[]>([]);
  activeUserProgram = signal<Program | null>(null);
  programTrades = signal<Trade[]>([]);

  getUserPrograms(userId: string, isUserDirector: boolean = false): void {
    const userRef = doc(this.fs, `users/${userId}`);
    let programQuery = query(
      collection(this.fs, 'programs'),
      orderBy('name', 'asc')
    );

    if (!isUserDirector) {
      programQuery = query(
        programQuery,
        where('commissionerRef', '==', userRef)
      );
    }

    onSnapshot(programQuery, (snapshot) => {
      this.userPrograms.set(
        snapshot.docs.map((doc) => new Program({ id: doc.id, ...doc.data() }))
      );
    });
  }

  setActiveProgram(programId: string): void {
    const program = this.userPrograms().find((p) => p.id === programId);
    this.activeUserProgram.set(program);
    this.playerService.getProgramPlayers(programId);
    this.teamService.getProgramTeams(programId);
    this.evaluationService.getEvaluations(programId);
    this.getProgramTrades(programId);
  }

  async addProgram(userId: string, program: Partial<Program>): Promise<any> {
    const userRef = doc(this.fs, `users/${userId}`);
    const c = collection(this.fs, 'programs');
    const q = query(
      c,
      where('name', '==', program.name),
      where('commissionerRef', '==', userRef)
    );
    return await getDocs(q).then(async (snapshot) => {
      if (!snapshot.empty) {
        throw new Error('You have already created a program with this name.');
      }
      return await addDoc(c, {
        ...program,
        commissionerRef: userRef,
      });
    });
  }

  async updateProgram(
    programId: string,
    user: AppUser,
    program: Partial<Program>
  ): Promise<any> {
    const userRef = doc(this.fs, `users/${user.id}`);
    const c = collection(this.fs, 'programs');
    const q = query(
      c,
      where('name', '==', program.name),
      where('commissionerRef', '==', userRef),
      where(documentId(), '!=', programId)
    );
    return await getDocs(q).then(async (snapshot) => {
      if (!snapshot.empty) {
        throw new Error('A program with this name already exists.');
      }
      await updateDoc(doc(this.fs, `programs/${programId}`), program).then(
        async () => {
          if (
            this.activeUserProgram()?.id === programId &&
            program.active === false
          ) {
            this.activeUserProgram.set(null);
          } else {
            this.setActiveProgram(programId);
          }
        }
      );
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
    const batch = writeBatch(this.fs);

    // Delete all teams under the program
    const teamsCollection = collection(this.fs, `programs/${programId}/teams`);
    const teamsSnapshot = await getDocs(teamsCollection);
    teamsSnapshot.forEach((teamDoc) => {
      batch.delete(teamDoc.ref);
    });

    // Delete all trades under the program
    const tradesCollection = collection(
      this.fs,
      `programs/${programId}/trades`
    );
    const tradesSnapshot = await getDocs(tradesCollection);
    tradesSnapshot.forEach((tradeDoc) => {
      batch.delete(tradeDoc.ref);
    });

    // Update all player documents that refer to the program
    const playersQuery = query(
      collection(this.fs, 'players'),
      where('programRef', '==', programRef)
    );
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

  getProgramTrades(programId: string): void {
    const tradesQuery = query(
      collection(this.fs, `programs/${programId}/trades`)
    );
    onSnapshot(tradesQuery, (snapshot) => {
      this.programTrades.set(
        snapshot.docs.map((doc) => new Trade({ id: doc.id, ...doc.data() }))
      );
    });
  }

  async deleteTrade(programId: string, tradeId: string): Promise<any> {
    const tradeRef = doc(this.fs, `programs/${programId}/trades/${tradeId}`);
    return await deleteDoc(tradeRef);
  }

  async clearTrades(programId: string): Promise<any> {
    const tradeCollection = collection(this.fs, `programs/${programId}/trades`);
    const tradeSnapshot = await getDocs(tradeCollection);

    const batch = writeBatch(this.fs);
    tradeSnapshot.forEach((tradeDoc) => {
      batch.delete(tradeDoc.ref);
    });

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
