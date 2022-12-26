import { StepRegistration } from '../../shared/users/enums/stepRegistration';
import { Company } from './Company';
import { TypeRegistration } from '../../shared/users/enums/typeRegistration';
import { StepConnect } from 'src/common/constants/users/enums/stepConnect';

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
  stepRegistration: StepRegistration | StepConnect;
  typeRegistration: TypeRegistration;
  password?: string;
  salt?: string;
}
