import { StepRegistration } from '../../shared/users/enums/stepRegistration';
import { Company } from './Company';

export class User {
  id: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  codeEmail: string;
  username?: string;
  currentCompany?: string | Company;
  sendCodeDate: Date;
  stepRegistration: StepRegistration;
  password?: string;
  salt?: string;
}
