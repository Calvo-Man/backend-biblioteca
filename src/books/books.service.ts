
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
import { Copy, CopyStatus } from '../copies/entities/copy.entity';

import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(Copy)
    private readonly copyRepository: Repository<Copy>,
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

  // Agregar estadísticas de ejemplares a varios libros.
  private async addCopyStats(books: Book[]) {
    if (!books.length) return [];

    const bookIds = books.map((book) => book.id);

    const statistics = await this.copyRepository
      .createQueryBuilder('copy')
      .select('copy.book_id', 'book_id')
      .addSelect('COUNT(copy.id)', 'total_copies')
      .addSelect(
        `SUM(
          CASE
            WHEN copy.status = :available THEN 1
            ELSE 0
          END
        )`,
        'available_copies',
      )
      .where('copy.book_id IN (:...bookIds)', { bookIds })
      .setParameter('available', CopyStatus.AVAILABLE)
      .groupBy('copy.book_id')
      .getRawMany();

    const statisticsMap = new Map(
      statistics.map((item) => [
        Number(item.book_id),
        {
          total_copies: Number(item.total_copies) || 0,
          available_copies: Number(item.available_copies) || 0,
        },
      ]),
    );

    return books.map((book) => ({
      ...book,
      total_copies: statisticsMap.get(book.id)?.total_copies || 0,
      available_copies: statisticsMap.get(book.id)?.available_copies || 0,
    }));
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

  // Listar libros para administración
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

    const data = await this.addCopyStats(books);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==========================================
  // CATÁLOGO PARA ADMINISTRADORES Y ESTUDIANTES
  // ==========================================

  // Listar únicamente libros activos con disponibilidad
  async findCatalog(page = 1, limit = 12, search?: string) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const query = this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.category', 'category')
      .where('book.is_active = :isActive', {
        isActive: true,
      })
      .orderBy('book.title', 'ASC')
      .skip(skip)
      .take(safeLimit);

    if (search?.trim()) {
      query.andWhere(
        `(
          book.title LIKE :search OR
          book.author LIKE :search OR
          book.isbn LIKE :search OR
          category.name LIKE :search
        )`,
        { search: `%${search.trim()}%` },
      );
    }

    const [books, total] = await query.getManyAndCount();

    const bookIds = books.map((book) => book.id);

    const availability = bookIds.length
      ? await this.copyRepository
          .createQueryBuilder('copy')
          .select('copy.book_id', 'book_id')
          .addSelect('COUNT(copy.id)', 'available_copies')
          .where('copy.book_id IN (:...bookIds)', { bookIds })
          .andWhere('copy.status = :status', {
            status: CopyStatus.AVAILABLE,
          })
          .groupBy('copy.book_id')
          .getRawMany()
      : [];

    const availabilityMap = new Map(
      availability.map((item) => [
        Number(item.book_id),
        Number(item.available_copies),
      ]),
    );

    const data = books.map((book) => ({
      ...book,
      available_copies: availabilityMap.get(book.id) || 0,
    }));

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  // Consultar detalle de un libro activo
  async findCatalogOne(id: number) {
    const book = await this.bookRepository.findOne({
      where: {
        id,
        is_active: true,
      },
      relations: {
        category: true,
      },
    });

    if (!book) {
      throw new NotFoundException('Libro no encontrado');
    }

    const availableCopies = await this.copyRepository.count({
      where: {
        book_id: id,
        status: CopyStatus.AVAILABLE,
      },
    });

    return {
      ...book,
      available_copies: availableCopies,
    };
  }

  // ==========================================
  // OPERACIONES ADMINISTRATIVAS
  // ==========================================

  // Buscar libro por ID con estadísticas de ejemplares
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

    const [bookWithStats] = await this.addCopyStats([book]);

    return bookWithStats;
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
