import { EmployeesCount } from 'src/shared/company/enums/employeesCount';

export class Company {
  id: string;
  name: string;
  user: string;
  targetUser: Array<string>;
  amountOfEmployees: EmployeesCount;

  code: string;
  createdAt: Date;
  updatedAt: Date;
}
