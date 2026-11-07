
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { CopyStatus } from '../../copies/entities/copy.entity';

export class CreateReturnDto {
  // Estado que tendrá el ejemplar después de la devolución.
  // No se permite marcarlo como LOANED ni LOST desde una devolución.
  @IsOptional()
  @IsIn([
    CopyStatus.AVAILABLE,
    CopyStatus.DAMAGED,
    CopyStatus.IN_REPAIR,
  ])
  copy_status?: CopyStatus;

  // Observaciones específicas de esta devolución.
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
