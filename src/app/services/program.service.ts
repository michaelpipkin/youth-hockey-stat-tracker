import { computed, inject, Injectable, signal } from '@angular/core';
import { Guardian } from '@models/guardian';
import { Program } from '@models/program';
import { Coach } from '@shared/enums';
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
  currentProgramCoaches = signal<Guardian[]>([]);

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

  getProgramCoaches(programId: string): void {
    const playersCollection = collection(this.fs, 'players');
    const q = query(
      playersCollection,
      where('programId', '==', programId),
      where('parentCoach', '==', true),
      orderBy('lastName', 'asc'),
      orderBy('firstName', 'asc')
    );
    let coachesList: Guardian[] = [];
    onSnapshot(q, (snapshot) => {
      snapshot.forEach((doc) => {
        const playerData = doc.data();
        playerData.guardians.forEach((guardian: Guardian) => {
          if (guardian.coachManager !== Coach.N) {
            coachesList.push(guardian);
          }
        });
      });
      this.currentProgramCoaches.set(coachesList);
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

  async updateProgram(program: Partial<Program>): Promise<any> {
    const c = collection(this.fs, 'programs');
    const q = query(
      c,
      where('name', '==', program.name),
      where('ownerId', '==', program.ownerId),
      where(documentId(), '!=', program.id)
    );
    return await getDocs(q).then(async (snapshot) => {
      if (!snapshot.empty) {
        throw new Error('A program with this name already exists.');
      }
      return await updateDoc(doc(this.fs, `programs/${program.id}`), program);
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
    batch.commit();
  }
}
