import { User } from '../entities/User';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto implements Partial<User> {
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  email: string;

  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @MaxLength(11)
  @MinLength(7)
  phone: string;
}
