import { Goalie } from '@shared/enums';

export interface ITeam {
  id: string;
  name: string;
  description: string;
  players: [
    {
      playerId: string;
      jerseyNumber: string;
      goalie: Goalie;
    }
  ];
}

export class Team implements ITeam {
  constructor(init?: Partial<Team>) {
    Object.assign(this, init);
  }
  public id: string;
  public name: string;
  public description: string;
  public players: [
    {
      playerId: string;
      jerseyNumber: string;
      goalie: Goalie;
    }
  ];
  public hasGoalie(): boolean {
    return this.players.some((player) => player.goalie === Goalie.Y);
  }
}
