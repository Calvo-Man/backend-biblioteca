
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

import { CategoriesService } from './categories.service';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// =====================================================
// CONTROLADOR DE CATEGORÍAS
// =====================================================

// Todas las rutas requieren autenticación y rol ADMIN.

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
  ) {}

  // =====================================================
  // CREAR CATEGORÍA
  // =====================================================

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  // =====================================================
  // LISTAR CATEGORÍAS
  // =====================================================

  @Get()
  findAll(
    // Número de página.
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,

    // Cantidad de registros por página.
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,

    // Filtro opcional por nombre.
    @Query('search') search?: string,
  ) {
    return this.categoriesService.findAll(
      Math.max(1, page),
      Math.min(100, Math.max(1, limit)),
      search,
    );
  }

  // =====================================================
  // BUSCAR CATEGORÍA POR ID
  // =====================================================

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  // =====================================================
  // ACTUALIZAR CATEGORÍA
  // =====================================================

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  // =====================================================
  // ACTIVAR O DESACTIVAR CATEGORÍA
  // =====================================================

  @Patch(':id/status')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.toggleStatus(id);
  }
}
