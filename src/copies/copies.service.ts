import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Copy, CopyStatus } from './entities/copy.entity';
import { Book } from '../books/entities/book.entity';

import { CreateCopyDto } from './dto/create-copy.dto';
import { UpdateCopyDto } from './dto/update-copy.dto';
import { UpdateCopyStatusDto } from './dto/update-copy-status.dto';
import { FindCopiesDto } from './dto/find-copies.dto';

@Injectable()
export class CopiesService {
  constructor(
    @InjectRepository(Copy)
    private readonly copyRepository: Repository<Copy>,

    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  // Registrar ejemplar
  async create(createCopyDto: CreateCopyDto) {
    const { book_id, copy_code } = createCopyDto;

    const book = await this.bookRepository.findOne({
      where: { id: book_id },
    });

    if (!book) {
      throw new NotFoundException('El libro no existe');
    }

    if (!book.is_active) {
      throw new BadRequestException(
        'No se pueden registrar ejemplares de un libro inactivo',
      );
    }

    const existingCopy = await this.copyRepository.findOne({
      where: { copy_code },
    });

    if (existingCopy) {
      throw new ConflictException('El código del ejemplar ya está registrado');
    }

    const copy = this.copyRepository.create({
      ...createCopyDto,
      status: CopyStatus.AVAILABLE,
    });

    return this.copyRepository.save(copy);
  }

  // Consultar todos los ejemplares con filtros
  async findAll(filters: FindCopiesDto) {
    const { page = 1, limit = 10, book_id, status, search } = filters;

    const query = this.copyRepository
      .createQueryBuilder('copy')
      .leftJoinAndSelect('copy.book', 'book');

    if (book_id) {
      query.andWhere('copy.book_id = :book_id', { book_id });
    }

    if (status) {
      query.andWhere('copy.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(copy.copy_code LIKE :search OR book.title LIKE :search)',
        { search: `%${search}%` },
      );
    }

    query
      .orderBy('copy.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Consultar un ejemplar
  async findOne(id: number) {
    const copy = await this.copyRepository.findOne({
      where: { id },
      relations: {
        book: true,
      },
    });

    if (!copy) {
      throw new NotFoundException('El ejemplar no existe');
    }

    return copy;
  }

  // Consultar ejemplares de un libro
  async findByBook(bookId: number) {
    const book = await this.bookRepository.findOne({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException('El libro no existe');
    }

    const copies = await this.copyRepository.find({
      where: { book_id: bookId },
      order: { id: 'ASC' },
    });

    return {
      book: {
        id: book.id,
        title: book.title,
      },
      total: copies.length,
      available: copies.filter((copy) => copy.status === CopyStatus.AVAILABLE)
        .length,
      copies,
    };
  }

  // Actualizar información del ejemplar
  async update(id: number, updateCopyDto: UpdateCopyDto) {
    const copy = await this.findOne(id);

    if (updateCopyDto.book_id !== undefined) {
      const newBook = await this.bookRepository.findOne({
        where: { id: updateCopyDto.book_id },
      });

      if (!newBook) {
        throw new NotFoundException('El nuevo libro no existe');
      }

      if (!newBook.is_active) {
        throw new BadRequestException(
          'No se pueden asignar ejemplares a un libro inactivo',
        );
      }

      if (
        updateCopyDto.book_id !== copy.book_id &&
        copy.status === CopyStatus.LOANED
      ) {
        throw new BadRequestException(
          'No se puede cambiar de libro un ejemplar prestado',
        );
      }
    }

    if (updateCopyDto.copy_code && updateCopyDto.copy_code !== copy.copy_code) {
      const existing = await this.copyRepository.findOne({
        where: { copy_code: updateCopyDto.copy_code },
      });

      if (existing) {
        throw new ConflictException(
          'El código del ejemplar ya está registrado',
        );
      }
    }

    Object.assign(copy, updateCopyDto);

    return this.copyRepository.save(copy);
  }

  // Cambiar estado manualmente
  async updateStatus(id: number, updateCopyStatusDto: UpdateCopyStatusDto) {
    const copy = await this.findOne(id);

    if (updateCopyStatusDto.status === CopyStatus.LOANED) {
      throw new BadRequestException(
        'El estado LOANED solamente puede asignarse desde el módulo de préstamos',
      );
    }

    if (copy.status === CopyStatus.LOANED) {
      throw new BadRequestException(
        'El ejemplar está prestado. Su estado debe gestionarse desde el módulo de préstamos',
      );
    }

    copy.status = updateCopyStatusDto.status;

    return this.copyRepository.save(copy);
  }

  // Eliminar ejemplar
  async remove(id: number) {
    const copy = await this.findOne(id);

    if (copy.status === CopyStatus.LOANED) {
      throw new BadRequestException(
        'No se puede eliminar un ejemplar que está prestado',
      );
    }

    await this.copyRepository.remove(copy);

    return {
      message: 'Ejemplar eliminado correctamente',
    };
  }
}
