import { inject, Injectable, signal } from '@angular/core';
import { Guardian } from '@models/guardian';
import { Player } from '@models/player';
import { Team } from '@models/team';
import { Coach } from '@shared/enums';
import {
  addDoc,
  collection,
  doc,
  documentId,
  DocumentReference,
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
export class TeamService {
  fs = inject(Firestore);

  currentProgramTeams = signal<Team[]>([]);
  currentTeam = signal<Team | null>(null);
  currentTeamCoaches = signal<Guardian[]>([]);
  currentTeamCoachRefs = signal<DocumentReference[]>([]);

  async getProgramTeams(programId: string): Promise<void> {
    const programRef = doc(this.fs, `programs/${programId}`);
    const teamCollection = collection(this.fs, `programs/${programId}/teams`);
    const teamQuery = query(teamCollection, orderBy('name', 'asc'));

    onSnapshot(teamQuery, async (teamSnapshot) => {
      const teams = await Promise.all(
        teamSnapshot.docs.map(async (teamDoc) => {
          const teamData = teamDoc.data();
          const team = new Team({ id: teamDoc.id, ...teamData });

          const coachRefs = [
            { ref: teamData.headCoachRef, field: 'headCoach' },
            { ref: teamData.assistantCoach1Ref, field: 'assistantCoach1' },
            { ref: teamData.assistantCoach2Ref, field: 'assistantCoach2' },
            { ref: teamData.managerRef, field: 'manager' },
          ];

          for (const { ref, field } of coachRefs) {
            if (ref) {
              const guardianDoc = await getDoc(ref);
              if (guardianDoc.exists()) {
                const guardianData = guardianDoc.data() as Record<string, any>;
                team[field] = new Guardian({
                  id: guardianDoc.id,
                  ...guardianData,
                });
              }
            }
          }
          return team;
        })
      );

      const playerCollection = collection(this.fs, 'players');
      const playerQuery = query(
        playerCollection,
        where('programRef', '==', programRef),
        where('teamRef', '!=', null)
      );

      onSnapshot(playerQuery, (playerSnapshot) => {
        const players = playerSnapshot.docs.map(
          (playerDoc) => new Player({ id: playerDoc.id, ...playerDoc.data() })
        );

        players.forEach(async (player) => {
          const guardianCollection = collection(
            this.fs,
            `players/${player.id}/guardians`
          );
          const guardianQuery = query(guardianCollection);
          onSnapshot(guardianQuery, (guardianSnapshot) => {
            const guardians = guardianSnapshot.docs.map(
              (guardianDoc) =>
                new Guardian({ id: guardianDoc.id, ...guardianDoc.data() })
            );
            player.guardians = guardians;
          });
        });

        teams.forEach((team) => {
          team.players = players.filter(
            (player) => player.teamRef.id === team.id
          );
        });

        this.currentProgramTeams.set(teams);
      });
    });
  }

  async getTeam(programId: string, teamId: string): Promise<any> {
    const teamRef = doc(this.fs, `programs/${programId}/teams/${teamId}`);
    const teamDoc = await getDoc(teamRef);
    if (!teamDoc.exists()) {
      throw new Error('Team not found');
    }

    const teamData = teamDoc.data();
    const team = new Team({ id: teamDoc.id, ...teamData });

    const coachRefs = [
      { ref: teamData.headCoachRef, field: 'headCoach' },
      { ref: teamData.assistantCoach1Ref, field: 'assistantCoach1' },
      { ref: teamData.assistantCoach2Ref, field: 'assistantCoach2' },
      { ref: teamData.managerRef, field: 'manager' },
    ];

    for (const { ref, field } of coachRefs) {
      if (ref) {
        const guardianDoc = await getDoc(ref);
        if (guardianDoc.exists()) {
          const guardianData = guardianDoc.data() as Record<string, any>;
          team[field] = new Guardian({
            id: guardianDoc.id,
            ...guardianData,
          });
        }
      }
    }

    const playerCollection = collection(this.fs, 'players');
    const playerQuery = query(
      playerCollection,
      where('teamRef', '==', teamRef)
    );
    const playerSnapshot = await getDocs(playerQuery);

    const players = playerSnapshot.docs.map(
      (playerDoc) => new Player({ id: playerDoc.id, ...playerDoc.data() })
    );

    team.players = players;
    this.currentTeam.set(team);
  }

  async getTransferTeams(programId: string, teamId: string): Promise<Team[]> {
    const teamCollection = collection(this.fs, `programs/${programId}/teams`);
    const teamQuery = query(
      teamCollection,
      where(documentId(), '!=', teamId),
      orderBy('name', 'asc')
    );
    const teamSnapshot = await getDocs(teamQuery);

    const teams = teamSnapshot.docs.map((teamDoc) => {
      const teamData = teamDoc.data();
      return new Team({ id: teamDoc.id, ...teamData });
    });

    return teams;
  }

  async addTeam(programId: string, team: Partial<Team>): Promise<any> {
    const c = collection(this.fs, `programs/${programId}/teams`);
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

  async generateTeams(programId: string, numberOfTeams: number): Promise<any> {
    let teamNumber: number = 1;
    let teamName: string = '';
    const c = collection(this.fs, `programs/${programId}/teams`);
    const q = query(c, orderBy('name', 'asc'));
    return await getDocs(q).then(async (snapshot) => {
      const teamNames = snapshot.docs.map((doc) => doc.data().name);
      const batch = writeBatch(this.fs);
      for (let i = 0; i < numberOfTeams; i++) {
        do {
          teamName = `Team ${teamNumber++}`;
        } while (teamNames.includes(teamName));
        batch.set(doc(c), {
          name: teamName,
          description: '',
          headCoachRef: null,
          assistantCoach1Ref: null,
          assistantCoach2Ref: null,
          managerRef: null,
          otherCoaches: '',
        });
      }
      return await batch.commit();
    });
  }

  async getTeamCoaches(programId: string, teamId: string): Promise<void> {
    const teamRef = doc(this.fs, `programs/${programId}/teams/${teamId}`);
    const playerCollection = collection(this.fs, 'players');
    const playerQuery = query(
      playerCollection,
      where('teamRef', '==', teamRef)
    );
    const playerSnapshot = await getDocs(playerQuery);

    const coaches: Guardian[] = [];
    const coachRefs: DocumentReference[] = [];

    for (const playerDoc of playerSnapshot.docs) {
      const playerId = playerDoc.id;
      const guardianCollection = collection(
        this.fs,
        `players/${playerId}/guardians`
      );
      const guardianQuery = query(
        guardianCollection,
        where('availableCoachRole', '!=', Coach.N)
      );
      const guardianSnapshot = await getDocs(guardianQuery);

      guardianSnapshot.forEach((guardianDoc) => {
        coachRefs.push(guardianDoc.ref);
        const guardianData = guardianDoc.data() as Record<string, any>;
        coaches.push(new Guardian({ id: guardianDoc.id, ...guardianData }));
      });
    }

    this.currentTeamCoaches.set(coaches);
    this.currentTeamCoachRefs.set(coachRefs);
  }

  async updateTeam(
    programId: string,
    teamId: string,
    team: Partial<Team>
  ): Promise<any> {
    const c = collection(this.fs, `programs/${programId}/teams`);
    const q = query(
      c,
      where('name', '==', team.name),
      where(documentId(), '!=', teamId)
    );
    return await getDocs(q).then(async (snapshot) => {
      if (!snapshot.empty) {
        throw new Error(
          'A team with that name already exists in this program.'
        );
      }
      return await updateDoc(
        doc(this.fs, `programs/${programId}/teams/${teamId}`),
        team
      );
    });
  }

  async deleteTeam(programId: string, teamId: string): Promise<any> {
    const teamRef = doc(this.fs, `programs/${programId}/teams/${teamId}`);

    const playersCollection = collection(this.fs, 'players');
    const playerQuery = query(
      playersCollection,
      where('teamRef', '==', teamRef)
    );
    const playerSnapshot = await getDocs(playerQuery);

    const batch = writeBatch(this.fs);
    playerSnapshot.forEach((playerDoc) => {
      batch.update(playerDoc.ref, { teamRef: null });
    });
    batch.delete(teamRef);

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
