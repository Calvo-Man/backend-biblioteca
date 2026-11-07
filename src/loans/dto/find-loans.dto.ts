
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  Length,
} from 'class-validator';

import { LoanStatus } from '../entities/loan.entity';

export class FindLoansDto {
  // Número de página.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  // Cantidad de registros por página.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  // Filtrar por estado del préstamo o por vencidos.
  @IsOptional()
  @IsIn([...Object.values(LoanStatus), 'OVERDUE'])
  status?: LoanStatus | 'OVERDUE';

  // Filtrar por número de documento del estudiante.
  @IsOptional()
  @IsString()
  @Length(1, 20)
  student_document?: string;

  // Buscar por estudiante, documento, código de ejemplar o título del libro.
  @IsOptional()
  @IsString()
  search?: string;
}
