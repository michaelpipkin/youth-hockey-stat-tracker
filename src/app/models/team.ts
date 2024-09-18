import { DocumentReference } from '@angular/fire/firestore';
import { Gender, Goalie } from '@shared/enums';
import { Player } from './player';

export interface ITeam {
  id: string;
  name: string;
  description: string;
  players: Player[];
  headCoach: DocumentReference;
  assistantCoach1: DocumentReference;
  assistantCoach2: DocumentReference;
  manager: DocumentReference;
}

export class Team implements ITeam {
  constructor(init?: Partial<Team>) {
    Object.assign(this, init);
  }
  public id: string;
  public name: string;
  public description: string;
  public players: Player[];
  public headCoach: DocumentReference;
  public assistantCoach1: DocumentReference;
  public assistantCoach2: DocumentReference;
  public manager: DocumentReference;
  public get hasGoalie(): boolean {
    return this.players.some((player) => player.goalie === Goalie.Y);
  }
  public get femalePlayerCount(): number {
    return this.players.filter((player) => player.gender === Gender.F).length;
  }
  public get averageScore(): number {
    return this.players.length === 0
      ? 0
      : this.players.reduce((acc, player) => acc + player.evaluationScore, 0) /
          this.players.length;
  }
}
