import { Timestamp } from '@angular/fire/firestore';

export interface ITrade {
  id: string;
  tradeDate: Timestamp;
  playerName: string;
  fromTeam: string;
  toTeam: string;
}

export class Trade implements ITrade {
  constructor(init?: Partial<Trade>) {
    Object.assign(this, init);
  }
  public id: string;
  public tradeDate: Timestamp;
  public playerName: string;
  public fromTeam: string;
  public toTeam: string;
}
