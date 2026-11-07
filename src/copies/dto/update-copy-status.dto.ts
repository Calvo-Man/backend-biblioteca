import { IsEnum } from 'class-validator';
import { CopyStatus } from '../entities/copy.entity';

export class UpdateCopyStatusDto {
  @IsEnum(CopyStatus)
  status: CopyStatus;
}