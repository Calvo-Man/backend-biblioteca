
import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { DashboardService } from './dashboard.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  // Consultar las estadísticas generales de la biblioteca.
  // Disponible exclusivamente para administradores.
  @Get('overview')
  getOverview() {
    return this.dashboardService.getOverview();
  }
}
