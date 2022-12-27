import { User } from '../entities/User';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerificationUserDto implements Partial<User> {
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  emailCode: string;
}
