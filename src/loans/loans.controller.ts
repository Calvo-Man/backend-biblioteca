
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';

import { LoansService } from './loans.service';

import { CreateLoanDto } from './dto/create-loan.dto';
import { FindLoansDto } from './dto/find-loans.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  // Registrar un préstamo. Solo administradores.
  // El ID del administrador se obtiene del token.
  @Post()
  @Roles('ADMIN')
  create(
    @Body() createLoanDto: CreateLoanDto,
    @Req() req: any,
  ) {
    return this.loansService.create(
      createLoanDto,
      req.user.id,
    );
  }

  // Consultar todos los préstamos. Solo administradores.
  @Get()
  @Roles('ADMIN')
  findAll(@Query() filters: FindLoansDto) {
    return this.loansService.findAll(filters);
  }

  // Consultar los préstamos de un estudiante por documento.
  // Solo administradores.
  @Get('student/document/:documentNumber')
  @Roles('ADMIN')
  findByStudentDocument(
    @Param('documentNumber') documentNumber: string,
  ) {
    return this.loansService.findByStudentDocument(
      documentNumber,
    );
  }

  // Consultar los préstamos propios.
  // El ID del estudiante se obtiene del token.
  @Get('my-loans')
  @Roles('STUDENT')
  findMyLoans(@Req() req: any) {
    return this.loansService.findMyLoans(req.user.id);
  }

  // Consultar un préstamo por ID. Solo administradores.
  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.findOne(id);
  }
}
