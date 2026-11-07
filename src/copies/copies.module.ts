import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CopiesController } from './copies.controller';
import { CopiesService } from './copies.service';

import { Copy } from './entities/copy.entity';
import { Book } from '../books/entities/book.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Copy, Book])],
  controllers: [CopiesController],
  providers: [CopiesService],
  exports: [CopiesService],
})
export class CopiesModule {}