import { DocumentReference } from '@angular/fire/firestore';
import { Gender, Goalie } from '@shared/enums';
import { Guardian } from './guardian';
import { Player } from './player';

export interface ITeam {
  id: string;
  name: string;
  description: string;
  players: Player[];
  headCoachRef: DocumentReference;
  headCoach: Guardian;
  assistantCoach1Ref: DocumentReference;
  assistantCoach1: Guardian;
  assistantCoach2Ref: DocumentReference;
  assistantCoach2: Guardian;
  managerRef: DocumentReference;
  manager: Guardian;
}

export class Team implements ITeam {
  constructor(init?: Partial<Team>) {
    Object.assign(this, init);
  }
  public id: string;
  public name: string;
  public description: string;
  public players: Player[];
  public headCoachRef: DocumentReference;
  public headCoach: Guardian;
  public assistantCoach1Ref: DocumentReference;
  public assistantCoach1: Guardian;
  public assistantCoach2Ref: DocumentReference;
  public assistantCoach2: Guardian;
  public managerRef: DocumentReference;
  public manager: Guardian;
  public otherCoaches: string;
  public get hasGoalie(): boolean {
    return this.players.some((player) => player.goalie === Goalie.Y);
  }
  public get femaleNbPlayerCount(): number {
    return this.players.filter((player) => player.gender !== Gender.M).length;
  }
  public get averageScore(): number {
    return this.players.length === 0
      ? 0
      : this.players.reduce((acc, player) => acc + player.evaluationScore, 0) /
          this.players.length;
  }
}
