
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateLoanDto {
  // Número de documento del estudiante que recibirá el préstamo.
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  student_document: string;

  // ID del ejemplar físico que se prestará.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  copy_id: number;

  // Cantidad de días del préstamo, seleccionada por el administrador.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  loan_days: number;
}
