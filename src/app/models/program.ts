import { IEvaluation } from './evaluation';
import { ITeam } from './team';

export interface IProgram {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  active: boolean;
  teams: ITeam[];
  evaluations: IEvaluation[];
}

export class Program implements IProgram {
  constructor(init?: Partial<Program>) {
    Object.assign(this, init);
  }
  public id: string;
  public ownerId: string;
  public name: string;
  public description: string;
  public active: boolean;
  public teams: ITeam[];
  public evaluations: IEvaluation[];
}
