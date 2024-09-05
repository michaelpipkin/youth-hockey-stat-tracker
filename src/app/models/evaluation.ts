import { EvaluationCategory } from '@shared/enums';

export interface IEvaluation {
  id: string;
  evaluatorName: string;
  evaluationDate: Date;
  scores: [
    { category: EvaluationCategory; tryoutNumber: string; score: number }
  ];
}

export class Evaluation implements IEvaluation {
  constructor(init?: Partial<Evaluation>) {
    Object.assign(this, init);
  }
  public id: string;
  public evaluatorName: string;
  public evaluationDate: Date;
  public scores: [
    { category: EvaluationCategory; tryoutNumber: string; score: number }
  ];
}

export class EvaluationResult {
  constructor() {
    this.totalLooks = 0;
    this.totalScore = 0;
  }
  public totalLooks: number;
  public totalScore: number;
  public get averageScore(): number {
    return this.totalScore / this.totalLooks;
  }
}
