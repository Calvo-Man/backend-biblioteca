import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { unlink } from 'fs/promises';
import { join } from 'path';

import { Book } from './entities/book.entity';
import { Category } from '../categories/entities/category.entity';

import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  private async deleteCover(filename?: string | null) {
    if (!filename) return;

    const filePath = join(
      process.cwd(),
      'uploads',
      'book-covers',
      filename,
    );

    try {
      await unlink(filePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('No se pudo eliminar la portada:', error);
      }
    }
  }

  // Crear libro
  async create(dto: CreateBookDto, coverFilename?: string) {
    const category = await this.categoryRepository.findOne({
      where: {
        id: dto.category_id,
        is_active: true,
      },
    });

    if (!category) {
      await this.deleteCover(coverFilename);

      throw new BadRequestException(
        'La categoría no existe o está inactiva',
      );
    }

    if (dto.isbn) {
      const existingBook = await this.bookRepository.findOne({
        where: { isbn: dto.isbn },
      });

      if (existingBook) {
        await this.deleteCover(coverFilename);

        throw new ConflictException('El ISBN ya está registrado');
      }
    }

    const book = this.bookRepository.create({
      ...dto,
      category,
      cover_image: coverFilename
        ? `/uploads/book-covers/${coverFilename}`
        : null,
    });

    return this.bookRepository.save(book);
  }

  // Listar libros con paginación y búsqueda
  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const query = this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.category', 'category')
      .skip(skip)
      .take(limit)
      .orderBy('book.id', 'DESC');

    if (search) {
      query.where(
        `(
          book.title LIKE :search OR
          book.author LIKE :search OR
          book.isbn LIKE :search OR
          category.name LIKE :search
        )`,
        { search: `%${search}%` },
      );
    }

    const [books, total] = await query.getManyAndCount();

    return {
      data: books,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Buscar libro por ID
  async findOne(id: number) {
    const book = await this.bookRepository.findOne({
      where: { id },
      relations: {
        category: true,
      },
    });

    if (!book) {
      throw new NotFoundException('Libro no encontrado');
    }

    return book;
  }

  // Actualizar libro
  async update(
    id: number,
    dto: UpdateBookDto,
    coverFilename?: string,
  ) {
    const book = await this.findOne(id);

    if (dto.category_id) {
      const category = await this.categoryRepository.findOne({
        where: {
          id: dto.category_id,
          is_active: true,
        },
      });

      if (!category) {
        await this.deleteCover(coverFilename);

        throw new BadRequestException(
          'La categoría no existe o está inactiva',
        );
      }

      book.category = category;
      book.category_id = category.id;
    }

    if (dto.isbn && dto.isbn !== book.isbn) {
      const existingBook = await this.bookRepository.findOne({
        where: { isbn: dto.isbn },
      });

      if (existingBook) {
        await this.deleteCover(coverFilename);

        throw new ConflictException('El ISBN ya está registrado');
      }
    }

    const { category_id, ...bookData } = dto;

    Object.assign(book, bookData);

    const previousCover = book.cover_image;

    if (coverFilename) {
      book.cover_image = `/uploads/book-covers/${coverFilename}`;
    }

    const updatedBook = await this.bookRepository.save(book);

    if (coverFilename && previousCover) {
      const previousFilename = previousCover.split('/').pop();
      await this.deleteCover(previousFilename);
    }

    return updatedBook;
  }

  // Activar o desactivar libro
  async toggleStatus(id: number) {
    const book = await this.findOne(id);

    book.is_active = !book.is_active;

    return this.bookRepository.save(book);
  }
}