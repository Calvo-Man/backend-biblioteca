
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

import { StudentsService } from './students.service';

import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// =====================================================
// CONTROLADOR DE ESTUDIANTES
// =====================================================

// Todas las rutas requieren:
// 1. Un JWT válido almacenado en la cookie HttpOnly.
// 2. El rol ADMIN.

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // =====================================================
  // CREAR ESTUDIANTE
  // =====================================================

  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  // =====================================================
  // LISTAR ESTUDIANTES
  // =====================================================

  @Get()
  findAll(
    // Número de página.
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,

    // Cantidad de registros por página.
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,

    // Filtro opcional de búsqueda.
    @Query('search') search?: string,
  ) {
    return this.studentsService.findAll(
      Math.max(1, page),
      Math.min(100, Math.max(1, limit)),
      search,
    );
  }

  // =====================================================
  // CONSULTAR ESTUDIANTE POR ID
  // =====================================================

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.findOne(id);
  }

  // =====================================================
  // ACTUALIZAR ESTUDIANTE
  // =====================================================

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, updateStudentDto);
  }

  // =====================================================
  // ACTIVAR O DESACTIVAR ESTUDIANTE
  // =====================================================

  @Patch(':id/status')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.toggleStatus(id);
  }
}
