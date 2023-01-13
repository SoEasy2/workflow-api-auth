import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  password: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  id: string;
}
