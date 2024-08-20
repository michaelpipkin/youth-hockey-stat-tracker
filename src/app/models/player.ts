import { Gender, Goalie, TShirtSize } from '@shared/enums';
import { IAddress } from './address';
import { IGuardian } from './guardian';

export interface IPlayer {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: Date;
  addresses: IAddress[];
  guardians: IGuardian[];
  jerseyNumber: string;
  tShirtSize: TShirtSize;
  goalie: Goalie;
  programId: string;
  teamId: string;
  usaHockeyConfirmationNumber: string;
  importantInfo: string;
  active: boolean;
}

export class Player implements IPlayer {
  constructor(init?: Partial<Player>) {
    Object.assign(this, init);
  }
  public id: string;
  public firstName: string;
  public lastName: string;
  public gender: Gender;
  public birthDate: Date;
  public addresses: IAddress[];
  public guardians: IGuardian[];
  public jerseyNumber: string;
  public tShirtSize: TShirtSize;
  public goalie: Goalie;
  public programId: string;
  public teamId: string;
  public usaHockeyConfirmationNumber: string;
  public importantInfo: string;
  public active: boolean;
  public get age(): number {
    const today = new Date();
    const birthDate = new Date(this.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
