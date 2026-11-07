import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';

import { Loan } from './entities/loan.entity';
import { Student } from '../students/entities/student.entity';
import { Admin } from '../admins/entities/admin.entity';
import { Copy } from '../copies/entities/copy.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Loan,
      Student,
      Admin,
      Copy,
    ]),
  ],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}