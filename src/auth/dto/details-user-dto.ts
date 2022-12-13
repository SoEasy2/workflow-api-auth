import { User } from '../entities/User';
import { Company } from '../entities/Company';

export class DetailsUserDto {
  user: Partial<User>;
  company: Partial<Company>;
}
