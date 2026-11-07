import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not } from 'typeorm';

import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  // Crear categoría
  async create(dto: CreateCategoryDto) {
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: dto.name },
    });

    if (existingCategory) {
      throw new ConflictException('Esta categoría ya existe');
    }

    const category = this.categoryRepository.create(dto);

    return this.categoryRepository.save(category);
  }

  // Listar categorías con paginación y búsqueda
  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { name: Like(`%${search}%`) },
          { description: Like(`%${search}%`) },
        ]
      : {};

    const [categories, total] =
      await this.categoryRepository.findAndCount({
        where,
        skip,
        take: limit,
        order: {
          id: 'DESC',
        },
      });

    return {
      data: categories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Buscar categoría por ID
  async findOne(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return category;
  }

  // Actualizar categoría
  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    if (dto.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: {
          name: dto.name,
          id: Not(id),
        },
      });

      if (existingCategory) {
        throw new ConflictException('Esta categoría ya existe');
      }
    }

    Object.assign(category, dto);

    return this.categoryRepository.save(category);
  }

  // Activar o desactivar categoría
  async toggleStatus(id: number) {
    const category = await this.findOne(id);

    category.is_active = !category.is_active;

    return this.categoryRepository.save(category);
  }
}