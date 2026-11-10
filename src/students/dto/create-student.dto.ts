import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  full_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  document_number: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  student_code: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(50)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  grade: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  group_name: string;

  @IsEmail()
  @MaxLength(120)
  email: string;
}