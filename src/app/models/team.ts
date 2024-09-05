import { Gender, Goalie } from '@shared/enums';
import { Guardian } from './guardian';
import { Player } from './player';

export interface ITeam {
  id: string;
  name: string;
  description: string;
  players: [Player];
  headCoach: Guardian;
  assistantCoach1: Guardian;
  assistantCoach2: Guardian;
  manager: Guardian;
}

export class Team implements ITeam {
  constructor(init?: Partial<Team>) {
    Object.assign(this, init);
  }
  public id: string;
  public name: string;
  public description: string;
  public players: [Player];
  public headCoach: Guardian;
  public assistantCoach1: Guardian;
  public assistantCoach2: Guardian;
  public manager: Guardian;
  public get hasGoalie(): boolean {
    return this.players.some((player) => player.goalie === Goalie.Y);
  }
  public get femalePlayerCount(): number {
    return this.players.filter((player) => player.gender === Gender.F).length;
  }
}
