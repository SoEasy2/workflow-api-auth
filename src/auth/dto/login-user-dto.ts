import { User } from '../entities/User';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginUserDto implements Partial<User> {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  login: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(11)
  @MinLength(7)
  password: string;
}
