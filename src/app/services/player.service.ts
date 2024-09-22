import { inject, Injectable, signal } from '@angular/core';
import { Guardian } from '@models/guardian';
import { Player } from '@models/player';
import { GuardianService } from './guardian.service';
import {
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
export class PlayerService {
  fs = inject(Firestore);
  guardianService = inject(GuardianService);

  currentProgramPlayers = signal<Player[]>([]);
  currentTeamPlayers = signal<Player[]>([]);

  async getProgramPlayers(programId: string): Promise<void> {
    const programRef = doc(this.fs, `programs/${programId}`);
    const playerQuery = query(
      collection(this.fs, `players`),
      where('programRef', '==', programRef),
      orderBy('lastName', 'asc'),
      orderBy('firstName', 'asc')
    );

    const unassignedPlayerQuery = query(
      collection(this.fs, `players`),
      where('programRef', '==', null),
      orderBy('lastName', 'asc'),
      orderBy('firstName', 'asc')
    );

    const [assignedPlayersSnapshot, unassignedPlayersSnapshot] =
      await Promise.all([getDocs(playerQuery), getDocs(unassignedPlayerQuery)]);

    const combinedSnapshot = {
      docs: [
        ...assignedPlayersSnapshot.docs,
        ...unassignedPlayersSnapshot.docs,
      ],
    };

    const processSnapshot = async (snapshot: any) => {
      const players = await Promise.all(
        snapshot.docs.map(async (playerDoc: any) => {
          const playerData = playerDoc.data();
          const guardiansCollection = collection(
            this.fs,
            `players/${playerDoc.id}/guardians`
          );
          const guardiansSnapshot = await getDocs(guardiansCollection);
          const guardians = guardiansSnapshot.docs.map(
            (guardianDoc) =>
              new Guardian({ id: guardianDoc.id, ...guardianDoc.data() })
          );

          // Listen for changes in the guardians collection
          onSnapshot(guardiansCollection, (guardiansSnapshot) => {
            const updatedGuardians = guardiansSnapshot.docs.map(
              (guardianDoc) =>
                new Guardian({ id: guardianDoc.id, ...guardianDoc.data() })
            );
            const updatedPlayer = new Player({
              id: playerDoc.id,
              ...playerData,
              guardians: updatedGuardians,
            });
            this.currentProgramPlayers.update((players) => {
              const index = players.findIndex((p) => p.id === playerDoc.id);
              if (index !== -1) {
                players[index] = updatedPlayer;
              }
              return players;
            });
          });

          return new Player({ id: playerDoc.id, ...playerData, guardians });
        })
      );
      this.currentProgramPlayers.set(players);
    };

    // Process the combined snapshot initially
    await processSnapshot(combinedSnapshot);

    // Listen for changes in the assigned players query
    onSnapshot(playerQuery, async (snapshot) => {
      if (!snapshot.empty) {
        await processSnapshot(snapshot);
      }
    });

    // Listen for changes in the unassigned players query
    onSnapshot(unassignedPlayerQuery, async (snapshot) => {
      if (!snapshot.empty) {
        await processSnapshot(snapshot);
      }
    });
  }

  async getTeamPlayers(programId: string, teamId: string): Promise<void> {
    const teamRef = doc(this.fs, `programs/${programId}/teams/${teamId}`);
    const playerQuery = query(
      collection(this.fs, `players`),
      where('team', '==', teamRef),
      orderBy('lastName', 'asc'),
      orderBy('firstName', 'asc')
    );

    onSnapshot(playerQuery, async (snapshot) => {
      const players = await Promise.all(
        snapshot.docs.map(async (playerDoc) => {
          const playerData = playerDoc.data();
          const guardiansCollection = collection(
            this.fs,
            `players/${playerDoc.id}/guardians`
          );
          const guardiansSnapshot = await getDocs(guardiansCollection);
          const guardians = guardiansSnapshot.docs.map(
            (guardianDoc) =>
              new Guardian({ id: guardianDoc.id, ...guardianDoc.data() })
          );

          // Listen for changes in the guardians collection
          onSnapshot(guardiansCollection, (guardiansSnapshot) => {
            const updatedGuardians = guardiansSnapshot.docs.map(
              (guardianDoc) =>
                new Guardian({ id: guardianDoc.id, ...guardianDoc.data() })
            );
            const updatedPlayer = new Player({
              id: playerDoc.id,
              ...playerData,
              guardians: updatedGuardians,
            });
            this.currentTeamPlayers.update((players) => {
              const index = players.findIndex((p) => p.id === playerDoc.id);
              if (index !== -1) {
                players[index] = updatedPlayer;
              }
              return players;
            });
          });

          return new Player({ id: playerDoc.id, ...playerData, guardians });
        })
      );
      this.currentTeamPlayers.set(players);
    });
  }

  async getPlayer(playerId: string): Promise<Player> {
    const playerDoc = await getDoc(doc(this.fs, `players/${playerId}`));
    const playerData = playerDoc.data();

    const guardiansCollection = collection(
      this.fs,
      `players/${playerId}/guardians`
    );
    const guardiansSnapshot = await getDocs(guardiansCollection);
    const guardians = guardiansSnapshot.docs.map(
      (guardianDoc) =>
        new Guardian({ id: guardianDoc.id, ...guardianDoc.data() })
    );

    return new Player({ id: playerDoc.id, ...playerData, guardians });
  }

  async addPlayer(
    player: Partial<Player>,
    guardians: Partial<Guardian>[],
    programId: string = ''
  ): Promise<any> {
    // Check if programId is provided
    if (programId !== '') {
      const programRef = doc(this.fs, `programs/${programId}`);
      player.programRef = programRef;
    } else {
      player.programRef = null;
    }

    // Create a reference to the players collection
    const playerCollection = collection(this.fs, 'players');

    // Query for existing players with the same first name, last name, and birth date
    const playerQuery = query(
      playerCollection,
      where('firstName', '==', player.firstName),
      where('lastName', '==', player.lastName),
      where('birthDate', '==', player.birthDate)
    );

    // Get the snapshot of the query result
    const snapshot = await getDocs(playerQuery);

    // Check if there are any existing players with the same details
    if (!snapshot.empty) {
      throw new Error('Player already exists');
    }

    // Create a batch
    const batch = writeBatch(this.fs);

    // Add player to playerCollection
    const playerDocRef = doc(playerCollection);
    batch.set(playerDocRef, player);

    // Add guardians to guardians collection under the player
    const guardiansCollection = collection(
      this.fs,
      `players/${playerDocRef.id}/guardians`
    );
    guardians.forEach((guardian) => {
      const guardianDocRef = doc(guardiansCollection);
      batch.set(guardianDocRef, guardian);
    });

    // Commit the batch
    return await batch
      .commit()
      .then(() => {
        return playerDocRef.id;
      })
      .catch((err: Error) => {
        throw new Error(err.message);
      });
  }

  async updatePlayer(
    playerId: string,
    player: Partial<Player>,
    guardians: Partial<Guardian>[],
    teamId: string = ''
  ): Promise<any> {
    // If a teamId is provided, set the teamRef for the player
    player.teamRef =
      teamId === ''
        ? null
        : doc(this.fs, `programs/${player.programRef.id}/teams/${teamId}`);

    // Create a reference to the players collection
    const coll = collection(this.fs, 'players');

    // Query to check for existing players with the same first name, last name, and birth date
    const q1 = query(
      coll,
      where('firstName', '==', player.firstName),
      where('lastName', '==', player.lastName),
      where('birthDate', '==', player.birthDate),
      where(documentId(), '!=', playerId)
    );

    // Query to check for existing players with the same tryout number in the same program
    const q2 = query(
      coll,
      where('programRef', '==', player.programRef),
      where('tryoutNumber', '==', player.tryoutNumber),
      where(documentId(), '!=', playerId)
    );

    // Query to check for existing players with the same jersey number on the same team
    const q3 = query(
      coll,
      where('teamRef', '==', player.teamRef),
      where('jerseyNumber', '==', player.jerseyNumber),
      where(documentId(), '!=', playerId)
    );

    // Check if a player with the same name and birth date already exists
    if (!(await getDocs(q1)).empty) {
      throw new Error('A player with this name and birth date already exists.');
    }
    // Check if a player with the same tryout number already exists in the program
    if (
      player.programRef !== null &&
      player.tryoutNumber !== '' &&
      !(await getDocs(q2)).empty
    ) {
      throw new Error(
        'A player with this tryout number already exists in this program.'
      );
    }
    // Check if a player with the same jersey number already exists on the same team
    if (
      player.teamRef !== null &&
      player.jerseyNumber !== '' &&
      !(await getDocs(q3)).empty
    ) {
      throw new Error(
        'A player with this jersey number already exists on the same team.'
      );
    }
    const batch = writeBatch(this.fs);
    // Update the player document
    const playerDocRef = doc(this.fs, `players/${playerId}`);
    batch.update(playerDocRef, player);

    // Get existing guardians from the collection
    const guardiansCollection = collection(
      this.fs,
      `players/${playerId}/guardians`
    );
    const existingGuardiansSnapshot = await getDocs(guardiansCollection);

    // Create a map of existing guardians by their ID
    const existingGuardiansMap = new Map<string, any>();
    existingGuardiansSnapshot.forEach((doc) => {
      existingGuardiansMap.set(doc.id, doc);
    });

    // Update or delete existing guardians
    guardians.forEach((guardian) => {
      if (guardian.id) {
        if (existingGuardiansMap.has(guardian.id)) {
          // Update existing guardian
          const guardianDocRef = doc(guardiansCollection, guardian.id);
          const { id, ...guardianData } = guardian;
          batch.update(guardianDocRef, guardianData);
          existingGuardiansMap.delete(guardian.id);
        }
      } else {
        // Add new guardian
        const newGuardianDocRef = doc(guardiansCollection);
        const { id, ...guardianData } = guardian;
        batch.set(newGuardianDocRef, guardianData);
      }
    });

    // Delete remaining guardians that were not updated
    existingGuardiansMap.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Check for references to guardians in team documents and remove them
    if (!!player.programRef) {
      const teamsCollection = collection(
        this.fs,
        `programs/${player.programRef.id}/teams`
      );
      const teamsSnapshot = await getDocs(teamsCollection);
      teamsSnapshot.forEach((teamDoc) => {
        const teamData = teamDoc.data();
        const teamDocRef = doc(
          this.fs,
          `programs/${player.programRef.id}/teams/${teamDoc.id}`
        );
        let updateRequired = false;
        const updates: any = {};

        [
          'headCoachRef',
          'assistantCoach1Ref',
          'assistantCoach2Ref',
          'managerRef',
        ].forEach((coachField) => {
          if (
            teamData[coachField]?.id &&
            existingGuardiansSnapshot.docs.some(
              (guardianDoc) => guardianDoc.id === teamData[coachField].id
            )
          ) {
            updates[coachField] = null;
            updateRequired = true;
          }
        });

        if (updateRequired) {
          batch.update(teamDocRef, updates);
        }
      });
    }

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

  async deletePlayer(playerId: string): Promise<any> {
    const playerDoc = await getDoc(doc(this.fs, `players/${playerId}`));
    const player = new Player({ id: playerDoc.id, ...playerDoc.data() });
    if (player.programRef !== null || player.teamRef !== null) {
      throw new Error('Cannot delete a player assigned to a program or team.');
    } else {
      const batch = writeBatch(this.fs);

      // Delete player document
      const playerDocRef = doc(this.fs, `players/${playerId}`);
      batch.delete(playerDocRef);

      // Delete guardians collection under the player document
      const guardiansCollection = collection(
        this.fs,
        `players/${playerId}/guardians`
      );
      const guardiansSnapshot = await getDocs(guardiansCollection);
      guardiansSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Check for references to guardians in the team document and remove them
      if (player.teamRef) {
        const teamDoc = await getDoc(player.teamRef);
        const teamData = teamDoc.data();
        const teamDocRef = doc(this.fs, `teams/${teamDoc.id}`);
        let updateRequired = false;
        const updates: any = {};

        [
          'headCoachRef',
          'assistantCoach1Ref',
          'assistantCoach2Ref',
          'managerRef',
        ].forEach((coachField) => {
          if (
            teamData[coachField]?.id &&
            guardiansSnapshot.docs.some(
              (guardianDoc) => guardianDoc.id === teamData[coachField].id
            )
          ) {
            updates[coachField] = {};
            updateRequired = true;
          }
        });

        if (updateRequired) {
          batch.update(teamDocRef, updates);
        }
      }

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

  async addPlayerToProgram(playerId: string, programId: string): Promise<any> {
    const programRef = doc(this.fs, `programs/${programId}`);
    return await updateDoc(doc(this.fs, `players/${playerId}`), {
      programRef: programRef,
    })
      .then(() => {
        return true;
      })
      .catch((err: Error) => {
        throw new Error(err.message);
      });
  }

  async addPlayersToProgram(
    programId: string,
    playerIds: string[]
  ): Promise<any> {
    const programRef = doc(this.fs, `programs/${programId}`);
    const batch = writeBatch(this.fs);
    playerIds.forEach((playerId) => {
      const playerRef = doc(this.fs, `players/${playerId}`);
      batch.update(playerRef, { programRef: programRef });
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

  async removePlayerFromProgram(playerId: string): Promise<any> {
    const batch = writeBatch(this.fs);
    const playerRef = doc(this.fs, `players/${playerId}`);

    // Update player document
    batch.update(playerRef, {
      programRef: null,
      teamRef: null,
      tryoutNumber: '',
      jerseyNumber: '',
    });

    // Get guardians collection under the player
    const guardiansCollection = collection(
      this.fs,
      `players/${playerId}/guardians`
    );
    const guardiansSnapshot = await getDocs(guardiansCollection);
    const guardianIds = guardiansSnapshot.docs.map((doc) => doc.id);

    // Check for references to guardians in team documents and remove them
    const playerDoc = await getDoc(playerRef);
    const playerData = playerDoc.data();
    const programRef = playerData?.programRef;

    if (!programRef) {
      throw new Error('Player is not associated with any program.');
    }

    const teamsCollection = collection(
      this.fs,
      `programs/${programRef.id}/teams`
    );
    const teamsSnapshot = await getDocs(teamsCollection);
    teamsSnapshot.forEach((teamDoc) => {
      const teamData = teamDoc.data();
      const teamDocRef = doc(this.fs, `teams/${teamDoc.id}`);
      let updateRequired = false;
      const updates: any = {};

      [
        'headCoachRef',
        'assistantCoach1Ref',
        'assistantCoach2Ref',
        'managerRef',
      ].forEach((coachField) => {
        if (
          teamData[coachField]?.id &&
          guardianIds.includes(teamData[coachField].id)
        ) {
          updates[coachField] = {};
          updateRequired = true;
        }
      });

      if (updateRequired) {
        batch.update(teamDocRef, updates);
      }
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

  async clearProgramPlayers(programId: string): Promise<any> {
    const programRef = doc(this.fs, `programs/${programId}`);
    const batch = writeBatch(this.fs);
    const playerQuery = query(
      collection(this.fs, 'players'),
      where('programRef', '==', programRef)
    );
    const playersSnapshot = await getDocs(playerQuery);

    // Update players to remove program and team references
    playersSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        programRef: null,
        teamRef: null,
        tryoutNumber: '',
        jerseyNumber: '',
        evaluationScore: 0,
        totalLooks: 0,
      });
    });

    // Get all teams in the program
    const teamsCollection = collection(this.fs, `programs/${programId}/teams`);
    const teamsSnapshot = await getDocs(teamsCollection);

    // Reset all coach fields
    teamsSnapshot.docs.forEach((teamDoc) => {
      batch.update(teamDoc.ref, {
        headCoach: null,
        assistantCoach1: null,
        assistantCoach2: null,
        manager: null,
        otherCoaches: '',
      });
    });

    // Get all evaluations in the program
    const evaluationsCollection = collection(
      this.fs,
      `programs/${programId}/evaluations`
    );
    const evaluationsSnapshot = await getDocs(evaluationsCollection);

    // Delete all evaluations
    evaluationsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
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

  async removePlayerFromTeam(player: Player): Promise<any> {
    const batch = writeBatch(this.fs);

    const playerRef = doc(this.fs, `players/${player.id}`);
    const teamRef = doc(
      this.fs,
      `programs/${player.programRef.id}/teams/${player.teamRef.id}`
    );

    // Update player document
    batch.update(playerRef, {
      teamRef: null,
      jerseyNumber: '',
    });

    // Get guardians collection under the player
    const guardiansCollection = collection(
      this.fs,
      `players/${player.id}/guardians`
    );
    const guardiansSnapshot = await getDocs(guardiansCollection);
    const guardianIds = guardiansSnapshot.docs.map((doc) => doc.id);

    // Check for references to guardians in the team document and remove them
    const teamDoc = await getDoc(teamRef);
    const teamData = teamDoc.data();
    let updateRequired = false;
    const updates: any = {};

    [
      'headCoachRef',
      'assistantCoach1Ref',
      'assistantCoach2Ref',
      'managerRef',
    ].forEach((coachField) => {
      if (
        teamData[coachField]?.id &&
        guardianIds.includes(teamData[coachField].id)
      ) {
        updates[coachField] = null;
        updateRequired = true;
      }
    });

    if (updateRequired) {
      batch.update(teamRef, updates);
    }

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

  async transferPlayer(player: Player, teamId: string): Promise<any> {
    const batch = writeBatch(this.fs);

    const playerRef = doc(this.fs, `players/${player.id}`);
    const newTeamRef = doc(
      this.fs,
      `programs/${player.programRef.id}/teams/${teamId}`
    );
    const oldTeamRef = player.teamRef;

    // Update player document
    batch.update(playerRef, {
      teamRef: newTeamRef,
      jerseyNumber: '',
    });

    // Get guardians collection under the player
    const guardiansCollection = collection(
      this.fs,
      `players/${player.id}/guardians`
    );
    const guardiansSnapshot = await getDocs(guardiansCollection);
    const guardianIds = guardiansSnapshot.docs.map((doc) => doc.id);

    // Check for references to guardians in the old team document and remove them
    if (oldTeamRef) {
      const oldTeamDoc = await getDoc(oldTeamRef);
      const oldTeamData = oldTeamDoc.data();
      let updateRequired = false;
      const updates: any = {};

      [
        'headCoachRef',
        'assistantCoach1Ref',
        'assistantCoach2Ref',
        'managerRef',
      ].forEach((coachField) => {
        if (
          oldTeamData[coachField]?.id &&
          guardianIds.includes(oldTeamData[coachField].id)
        ) {
          updates[coachField] = null;
          updateRequired = true;
        }
      });

      if (updateRequired) {
        batch.update(oldTeamRef, updates);
      }
    }

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

  async clearTeamPlayers(programId: string, teamId: string): Promise<any> {
    const teamRef = doc(this.fs, `programs/${programId}/teams/${teamId}`);
    const batch = writeBatch(this.fs);

    // Clear team reference from players
    const playerQuery = query(
      collection(this.fs, 'players'),
      where('teamRef', '==', teamRef)
    );
    await getDocs(playerQuery).then((snapshot) => {
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { teamRef: null });
      });
    });

    // Set all four coach fields on the team document to null
    batch.update(teamRef, {
      headCoach: null,
      assistantCoach1: null,
      assistantCoach2: null,
      manager: null,
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

  async clearAllTeamsPlayers(programId: string): Promise<any> {
    const batch = writeBatch(this.fs);

    // Get all teams in the program
    const teamsCollection = collection(this.fs, `programs/${programId}/teams`);
    const teamsSnapshot = await getDocs(teamsCollection);

    // Iterate through each team and clear players
    for (const teamDoc of teamsSnapshot.docs) {
      const teamRef = teamDoc.ref;

      // Clear team reference from players
      const playerQuery = query(
        collection(this.fs, 'players'),
        where('teamRef', '==', teamRef)
      );
      const playersSnapshot = await getDocs(playerQuery);
      playersSnapshot.docs.forEach((playerDoc) => {
        batch.update(playerDoc.ref, { teamRef: null });
      });

      // Set all four coach fields on the team document to null
      batch.update(teamRef, {
        headCoach: null,
        assistantCoach1: null,
        assistantCoach2: null,
        manager: null,
        otherCoaches: '',
      });
    }

    return await batch
      .commit()
      .then(() => {
        return true;
      })
      .catch((err: Error) => {
        throw new Error(err.message);
      });
  }

  async distributePlayersToTeams(programId: string): Promise<any> {
    const programRef = doc(this.fs, `programs/${programId}`);
    const teamCollection = query(
      collection(this.fs, `programs/${programId}/teams`),
      orderBy('name', 'asc')
    );
    const teamsSnapshot = await getDocs(teamCollection);

    const playerQuery = query(
      collection(this.fs, 'players'),
      where('programRef', '==', programRef),
      orderBy('evaluationScore', 'desc')
    );
    const playersSnapshot = await getDocs(playerQuery);

    const batch = writeBatch(this.fs);

    const teams = teamsSnapshot.docs.map((teamDoc) => ({
      id: teamDoc.id,
      ref: teamDoc.ref,
    }));

    let reverse = false;
    let teamIndex = 0;

    playersSnapshot.docs.forEach((playerDoc, index) => {
      const playerRef = playerDoc.ref;
      const team = teams[teamIndex];

      batch.update(playerRef, { teamRef: team.ref });

      if (reverse) {
        teamIndex--;
        if (teamIndex < 0) {
          teamIndex = 0;
          reverse = false;
        }
      } else {
        teamIndex++;
        if (teamIndex >= teams.length) {
          teamIndex = teams.length - 1;
          reverse = true;
        }
      }
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
