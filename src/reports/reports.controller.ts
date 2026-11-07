
import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { ReportsService } from './reports.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  // Obtener el resumen general de la biblioteca.
  @Get('summary')
  getSummary() {
    return this.reportsService.getSummary();
  }

  // Consultar los préstamos vencidos.
  @Get('overdue-loans')
  getOverdueLoans() {
    return this.reportsService.getOverdueLoans();
  }

  // Consultar los libros más prestados.
  @Get('most-borrowed-books')
  getMostBorrowedBooks() {
    return this.reportsService.getMostBorrowedBooks();
  }

  // Consultar el historial de préstamos.
  @Get('loan-history')
  getLoanHistory() {
    return this.reportsService.getLoanHistory();
  }
}
