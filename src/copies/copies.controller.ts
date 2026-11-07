
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CopiesService } from './copies.service';

import { CreateCopyDto } from './dto/create-copy.dto';
import { UpdateCopyDto } from './dto/update-copy.dto';
import { UpdateCopyStatusDto } from './dto/update-copy-status.dto';
import { FindCopiesDto } from './dto/find-copies.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// =====================================================
// CONTROLADOR DE EJEMPLARES
// =====================================================

// Todas las rutas requieren autenticación y rol ADMIN.

@Controller('copies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CopiesController {
  constructor(private readonly copiesService: CopiesService) {}

  // =====================================================
  // REGISTRAR EJEMPLAR
  // =====================================================

  @Post()
  create(@Body() createCopyDto: CreateCopyDto) {
    return this.copiesService.create(createCopyDto);
  }

  // =====================================================
  // LISTAR EJEMPLARES
  // =====================================================

  @Get()
  findAll(@Query() filters: FindCopiesDto) {
    return this.copiesService.findAll(filters);
  }

  // =====================================================
  // CONSULTAR EJEMPLARES DE UN LIBRO
  // =====================================================

  @Get('book/:bookId')
  findByBook(
    @Param('bookId', ParseIntPipe) bookId: number,
  ) {
    return this.copiesService.findByBook(bookId);
  }

  // =====================================================
  // CONSULTAR EJEMPLAR POR ID
  // =====================================================

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.copiesService.findOne(id);
  }

  // =====================================================
  // ACTUALIZAR EJEMPLAR
  // =====================================================

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCopyDto: UpdateCopyDto,
  ) {
    return this.copiesService.update(id, updateCopyDto);
  }

  // =====================================================
  // CAMBIAR ESTADO DEL EJEMPLAR
  // =====================================================

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCopyStatusDto: UpdateCopyStatusDto,
  ) {
    return this.copiesService.updateStatus(
      id,
      updateCopyStatusDto,
    );
  }

  // =====================================================
  // ELIMINAR EJEMPLAR
  // =====================================================

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.copiesService.remove(id);
  }
}
