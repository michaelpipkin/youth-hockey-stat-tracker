import { Coach } from '@shared/enums';

export interface IGuardian {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  coachManager: Coach;
}

export class Guardian implements IGuardian {
  constructor(init?: Partial<Guardian>) {
    Object.assign(this, init);
  }
  public firstName: string;
  public lastName: string;
  public email: string;
  public phone: string;
  public coachManager: Coach;
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
