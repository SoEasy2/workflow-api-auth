import { StepRegistration } from '../../shared/users/enums/stepRegistration';

export class User {
  id: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  codeEmail: string;
  sendCodeDate: Date;
  stepRegistration: StepRegistration;
  password?: string;
  salt?: string;
}
