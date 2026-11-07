import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';

import { Loan } from '../loans/entities/loan.entity';
import { Copy } from '../copies/entities/copy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, Copy])],
  controllers: [ReturnsController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}