export interface IGuardian {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export class Guardian implements IGuardian {
  constructor(init?: Partial<Guardian>) {
    Object.assign(this, init);
  }
  public id: string;
  public firstName: string;
  public lastName: string;
  public email: string;
  public phone: string;
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
