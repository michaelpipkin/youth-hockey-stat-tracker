import { Evaluation } from './evaluation';
import { Team } from './team';

export interface IProgram {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  teams: Team[];
  evaluations: Evaluation[];
}

export class Program implements IProgram {
  constructor(init?: Partial<Program>) {
    Object.assign(this, init);
  }
  public id: string;
  public name: string;
  public description: string;
  public startDate: Date;
  public endDate: Date;
  public teams: Team[];
  public evaluations: Evaluation[];
}
