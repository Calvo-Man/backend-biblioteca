
import {
  Controller,
  Post,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('returns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ReturnsController {
  constructor(
    private readonly returnsService: ReturnsService,
  ) {}

  // Registrar la devolución de un préstamo.
  // Solo los administradores pueden realizar esta operación.
  @Post(':loanId')
  create(
    @Param('loanId', ParseIntPipe) loanId: number,
    @Body() createReturnDto: CreateReturnDto,
  ) {
    return this.returnsService.create(
      loanId,
      createReturnDto,
    );
  }
}
