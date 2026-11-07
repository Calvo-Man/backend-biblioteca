
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { bookCoverUploadOptions } from './book-upload.config';

@Controller('books')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
  ) {}

  // ==========================================
  // CATÁLOGO: ADMIN Y STUDENT
  // ==========================================

  @Get('catalog')
  @Roles('ADMIN', 'STUDENT')
  findCatalog(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,

    @Query('limit', new DefaultValuePipe(12), ParseIntPipe)
    limit: number,

    @Query('search')
    search?: string,
  ) {
    return this.booksService.findCatalog(
      Math.max(1, page),
      Math.min(100, Math.max(1, limit)),
      search,
    );
  }

  @Get('catalog/:id')
  @Roles('ADMIN', 'STUDENT')
  findCatalogOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.booksService.findCatalogOne(id);
  }

  // ==========================================
  // OPERACIONES EXCLUSIVAS DEL ADMINISTRADOR
  // ==========================================

  @Post()
  @UseInterceptors(
    FileInterceptor('cover', bookCoverUploadOptions),
  )
  create(
    @Body() dto: CreateBookDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.booksService.create(
      dto,
      file?.filename,
    );
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,

    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,

    @Query('search')
    search?: string,
  ) {
    return this.booksService.findAll(
      Math.max(1, page),
      Math.min(100, Math.max(1, limit)),
      search,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('cover', bookCoverUploadOptions),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.booksService.update(
      id,
      dto,
      file?.filename,
    );
  }

  @Patch(':id/status')
  toggleStatus(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.booksService.toggleStatus(id);
  }
}
