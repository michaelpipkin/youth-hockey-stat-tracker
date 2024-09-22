export interface IAddress {
  street1: string;
  street2: string;
  city: string;
  state: string;
  zipCode: string;
}

export class Address implements IAddress {
  constructor(init?: Partial<Address>) {
    Object.assign(this, init);
  }
  public street1: string;
  public street2: string;
  public city: string;
  public state: string;
  public zipCode: string;
}
