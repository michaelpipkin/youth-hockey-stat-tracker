import { Coach, Gender, Goalie, TShirtSize } from '@shared/enums';
import { Timestamp } from 'firebase/firestore';
import { IAddress } from './address';
import { IGuardian } from './guardian';

export interface IPlayer {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: Timestamp;
  address: IAddress;
  guardians: IGuardian[];
  tryoutNumber: string;
  jerseyNumber: string;
  evaluationScore: number;
  totalLooks: number;
  tShirtSize: TShirtSize;
  goalie: Goalie;
  programId: string;
  teamId: string;
  usaHockeyNumber: string;
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
  public birthDate: Timestamp;
  public address: IAddress;
  public guardians: IGuardian[];
  public tryoutNumber: string;
  public jerseyNumber: string;
  public evaluationScore: number;
  public totalLooks: number;
  public tShirtSize: TShirtSize;
  public goalie: Goalie;
  public programId: string;
  public teamId: string;
  public usaHockeyNumber: string;
  public importantInfo: string;
  public active: boolean;
  public get age(): number {
    const today = new Date();
    const birthDate = new Date(this.birthDate.toDate());
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
  public get lastFirstName(): string {
    return `${this.lastName}, ${this.firstName}`;
  }
  public get parentCoach(): boolean {
    return this.guardians.some((guardian) => guardian.coachManager !== Coach.N);
  }
}
