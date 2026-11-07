import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsEnum,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';
import { CopyCondition } from '../entities/copy.entity';

export class CreateCopyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  copy_code: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  book_id: number;

  @IsOptional()
  @IsEnum(CopyCondition)
  condition?: CopyCondition;

  @IsOptional()
  @IsString()
  notes?: string;
}