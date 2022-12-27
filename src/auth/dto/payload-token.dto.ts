export class PayloadTokenDto {
  id: string;
  email: string;

  constructor(payload: any) {
    this.id = payload.id;
    this.email = payload.email;
  }
}
