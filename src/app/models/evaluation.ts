export interface IEvaluation {
  id: string;
  evaluatorName: string;
  playerId: string;
  skatingScore: number;
  puckControlScore: number;
  shootingScore: number;
  gamePlayScore: number;
}

export class Evaluation implements IEvaluation {
  constructor(init?: Partial<Evaluation>) {
    Object.assign(this, init);
  }
  public id: string;
  public evaluatorName: string;
  public playerId: string;
  public skatingScore: number;
  public puckControlScore: number;
  public shootingScore: number;
  public gamePlayScore: number;
}
