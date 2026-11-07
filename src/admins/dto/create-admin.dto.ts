import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  full_name: string;

  @IsEmail()
  @MaxLength(150)
  username: string;

  @IsString()
  @MinLength(8)
  password: string;
}