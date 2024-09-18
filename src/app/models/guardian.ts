import { DocumentReference } from '@angular/fire/firestore';
import { Coach } from '@shared/enums';

export interface IGuardian {
  id: string;
  players: DocumentReference[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  availableCoachRole: Coach;
  coachRole: Coach;
}

export class Guardian implements IGuardian {
  constructor(init?: Partial<Guardian>) {
    Object.assign(this, init);
  }
  public id: string;
  public players: DocumentReference[];
  public firstName: string;
  public lastName: string;
  public email: string;
  public phone: string;
  public availableCoachRole: Coach;
  public coachRole: Coach;
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
