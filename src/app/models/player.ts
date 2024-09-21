import { Timestamp } from '@angular/fire/firestore';
import { Coach, Gender, Goalie, TShirtSize } from '@shared/enums';
import { DocumentReference } from 'firebase/firestore';
import { IAddress } from './address';
import { IGuardian } from './guardian';

export interface IPlayer {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  pronouns: string;
  birthDate: Timestamp;
  address: IAddress;
  guardians: IGuardian[];
  tryoutNumber: string;
  jerseyNumber: string;
  evaluationScore: number;
  totalLooks: number;
  tShirtSize: TShirtSize;
  goalie: Goalie;
  programRef: DocumentReference;
  teamRef: DocumentReference;
  usaHockeyNumber: string;
  importantInfo: string;
}

export class Player implements IPlayer {
  constructor(init?: Partial<Player>) {
    Object.assign(this, init);
  }
  public id: string;
  public firstName: string;
  public lastName: string;
  public gender: Gender;
  public pronouns: string;
  public birthDate: Timestamp;
  public address: IAddress;
  public guardians: IGuardian[];
  public tryoutNumber: string;
  public jerseyNumber: string;
  public evaluationScore: number;
  public totalLooks: number;
  public tShirtSize: TShirtSize;
  public goalie: Goalie;
  public programRef: DocumentReference;
  public teamRef: DocumentReference;
  public usaHockeyNumber: string;
  public importantInfo: string;
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
  public get parentCoach(): Coach | null {
    const guardian = this.guardians.find(
      (g) => g.availableCoachRole !== Coach.N
    );
    return guardian ? guardian.availableCoachRole : null;
  }

  public get rosterName(): string {
    let name = `${this.firstName} ${this.lastName}`;
    if (this.goalie === Goalie.Y || this.goalie === Goalie.M) {
      name += ' (G)';
    }
    const coachRole = this.parentCoach;
    if (coachRole) {
      const coachRoleKey = Object.keys(Coach).find(
        (key) => Coach[key as keyof typeof Coach] === coachRole
      );
      if (coachRoleKey) {
        name += ` (${coachRoleKey})`;
      }
    }
    return name;
  }

  public get genderCode(): string {
    return Object.keys(Gender).find(
      (key) => Gender[key as keyof typeof Gender] === this.gender
    );
  }
}
