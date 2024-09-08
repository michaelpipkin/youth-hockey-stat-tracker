import { inject, Injectable, signal } from '@angular/core';
import { Guardian } from '@models/guardian';
import { Player } from '@models/player';
import { Team } from '@models/team';
import { Coach } from '@shared/enums';
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
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  fs = inject(Firestore);

  currentProgramTeams = signal<Team[]>([]);
  currentTeam = signal<Team | null>(null);
  currentTeamCoaches = signal<Guardian[]>([]);

  async getProgramTeams(programId: string): Promise<void> {
    const teamCollection = collection(this.fs, `programs/${programId}/teams`);
    const teamQuery = query(teamCollection, orderBy('name', 'asc'));

    onSnapshot(teamQuery, (teamSnapshot) => {
      const teams = teamSnapshot.docs.map(
        (doc) => new Team({ id: doc.id, ...doc.data() })
      );
      const playerCollection = collection(this.fs, 'players');
      const playerQuery = query(
        playerCollection,
        where('programId', '==', programId),
        where('teamId', '!=', '')
      );
      onSnapshot(playerQuery, (playerSnapshot) => {
        const players = playerSnapshot.docs.map(
          (doc) => new Player({ id: doc.id, ...doc.data() })
        );
        teams.forEach((team) => {
          team.players = players.filter((player) => player.teamId === team.id);
        });
        this.currentProgramTeams.set(teams);
      });
    });
  }

  async getTeam(programId: string, teamId: string): Promise<any> {
    const team = await getDoc(
      doc(this.fs, `progams/${programId}/teams/${teamId}`)
    );
    this.currentTeam.set(new Team({ id: team.id, ...team.data() }));
  }

  getTeamCoaches(teamId: string): void {
    const playersCollection = collection(this.fs, 'players');
    const q = query(
      playersCollection,
      where('teamId', '==', teamId),
      where('parentCoach', '==', true),
      orderBy('lastName', 'asc'),
      orderBy('firstName', 'asc')
    );
    const coachesList: Guardian[] = [];
    onSnapshot(q, (snapshot) => {
      snapshot.forEach((doc) => {
        const playerData = doc.data();
        playerData.guardians.forEach((guardian: Guardian) => {
          if (guardian.coachManager !== Coach.N) {
            coachesList.push(guardian);
          }
        });
      });
      this.currentTeamCoaches.set(coachesList);
    });
  }

  async addTeam(programId: string, team: Partial<Team>): Promise<any> {
    const c = collection(this.fs, `progams/${programId}/teams`);
    const q = query(c, where('name', '==', team.name));
    return await getDocs(q).then(async (snapshot) => {
      if (!snapshot.empty) {
        throw new Error(
          'A team with that name already exists in this program.'
        );
      } else {
        return await addDoc(c, team);
      }
    });
  }

  async updateTeam(programId: string, team: Partial<Team>): Promise<any> {
    const c = collection(this.fs, `progams/${programId}/teams`);
    const q = query(
      c,
      where('name', '==', team.name),
      where(documentId(), '!=', team.id)
    );
    return await getDocs(q).then(async (snapshot) => {
      if (!snapshot.empty) {
        throw new Error(
          'A team with that name already exists in this program.'
        );
      }
      return await updateDoc(
        doc(this.fs, `programs/${programId}/teams/${team.id}`),
        team
      );
    });
  }

  async deleteTeam(programId: string, teamId: string): Promise<any> {
    const c = collection(this.fs, 'players');
    const q = query(c, where('teamId', '==', teamId));
    return await getDocs(q).then(async (snapshot) => {
      if (!snapshot.empty) {
        throw new Error('Cannot delete a team with active players.');
      }
      return await deleteDoc(
        doc(this.fs, `programs/${programId}/teams/${teamId}`)
      );
    });
  }
}
