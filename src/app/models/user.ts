import { UserType } from '@shared/enums';

export interface IAppUser {
  id: string;
  email: string;
  displayName: string;
  userType: UserType;
  approved: boolean;
}

export class AppUser implements IAppUser {
  constructor(init?: Partial<AppUser>) {
    Object.assign(this, init);
  }
  public id: string;
  public email: string;
  public displayName: string;
  public userType: UserType;
  public approved: boolean;
}
