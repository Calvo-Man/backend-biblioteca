
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';

import { AdminsService } from './admins.service';

import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// =====================================================
// CONTROLADOR DE ADMINISTRADORES
// =====================================================

// Todas las rutas de este controlador requieren:
// 1. Un JWT válido almacenado en la cookie HttpOnly.
// 2. El rol ADMIN.

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  // =====================================================
  // CREAR ADMINISTRADOR
  // =====================================================

  @Post()
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminsService.create(createAdminDto);
  }

  // =====================================================
  // LISTAR ADMINISTRADORES
  // =====================================================

  @Get()
  findAll(
    // Número de página.
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,

    // Cantidad de registros por página.
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,

    // Filtro opcional por nombre de usuario.
    @Query('search') search?: string,
  ) {
    return this.adminsService.findAll(
      Math.max(1, page),
      Math.min(100, Math.max(1, limit)),
      search,
    );
  }

  // =====================================================
  // BUSCAR ADMINISTRADOR POR ID
  // =====================================================

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminsService.findOne(id);
  }

  // =====================================================
  // ACTUALIZAR ADMINISTRADOR
  // =====================================================

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    return this.adminsService.update(id, updateAdminDto);
  }

  // =====================================================
  // CAMBIAR ESTADO DEL ADMINISTRADOR
  // =====================================================

  @Patch(':id/status')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.adminsService.toggleStatus(id);
  }
}
