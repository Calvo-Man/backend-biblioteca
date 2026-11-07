
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Loan, LoanStatus } from '../loans/entities/loan.entity';
import { Copy, CopyStatus } from '../copies/entities/copy.entity';

import { CreateReturnDto } from './dto/create-return.dto';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,

    @InjectRepository(Copy)
    private readonly copyRepository: Repository<Copy>,

    private readonly dataSource: DataSource,
  ) {}

  // Registrar la devolución de un préstamo.
  async create(loanId: number, dto: CreateReturnDto) {
    return this.dataSource.transaction(async (manager) => {
      const loanRepo = manager.getRepository(Loan);
      const copyRepo = manager.getRepository(Copy);

      // Buscar y bloquear el préstamo para evitar devoluciones simultáneas.
      const loan = await loanRepo
        .createQueryBuilder('loan')
        .setLock('pessimistic_write')
        .where('loan.id = :loanId', { loanId })
        .getOne();

      if (!loan) {
        throw new NotFoundException('El préstamo no existe.');
      }

      // Verificar que el préstamo todavía esté activo.
      if (loan.status !== LoanStatus.ACTIVE) {
        throw new ConflictException(
          'Este préstamo ya fue devuelto.',
        );
      }

      // Determinar el estado que tendrá el ejemplar después de la devolución.
      const allowedStatuses = [
        CopyStatus.AVAILABLE,
        CopyStatus.DAMAGED,
        CopyStatus.IN_REPAIR,
      ];

      const copyStatus = dto.copy_status ?? CopyStatus.AVAILABLE;

      if (!allowedStatuses.includes(copyStatus)) {
        throw new BadRequestException(
          'El estado indicado no es válido para una devolución.',
        );
      }

      // Buscar y bloquear el ejemplar asociado al préstamo.
      const copy = await copyRepo
        .createQueryBuilder('copy')
        .setLock('pessimistic_write')
        .where('copy.id = :copyId', {
          copyId: loan.copy_id,
        })
        .getOne();

      if (!copy) {
        throw new NotFoundException('El ejemplar no existe.');
      }

      // Verificar que el ejemplar esté marcado como prestado.
      if (copy.status !== CopyStatus.LOANED) {
        throw new ConflictException(
          'El estado del ejemplar no coincide con el préstamo activo.',
        );
      }

      // Actualizar el estado del ejemplar.
      copy.status = copyStatus;

      await copyRepo.save(copy);

      // Actualizar la información del préstamo.
      loan.status = LoanStatus.RETURNED;
      loan.returned_at = new Date();

      // Guardar las observaciones de esta devolución,
      // sin modificar las notas generales del ejemplar.
      loan.return_notes = dto.notes ?? null;

      const savedLoan = await loanRepo.save(loan);

      // Calcular si la devolución se realizó después de la fecha límite.
      const returnedDate = this.getTodayString();
      const isOverdue = returnedDate > loan.due_date;

      const overdueDays = isOverdue
        ? this.calculateOverdueDays(
            loan.due_date,
            returnedDate,
          )
        : 0;

      return {
        message: 'Devolución registrada correctamente.',
        return: {
          loan_id: savedLoan.id,
          student_id: savedLoan.student_id,
          copy_id: savedLoan.copy_id,
          loan_date: savedLoan.loan_date,
          due_date: savedLoan.due_date,
          returned_at: savedLoan.returned_at,
          copy_status: copy.status,
          notes: savedLoan.return_notes,
          is_overdue: isOverdue,
          overdue_days: overdueDays,
        },
      };
    });
  }

  // Obtener la fecha actual en formato YYYY-MM-DD.
  private getTodayString(): string {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Calcular la cantidad exacta de días de retraso.
  private calculateOverdueDays(
    dueDate: string,
    returnedDate: string,
  ): number {
    const [dueYear, dueMonth, dueDay] = dueDate
      .split('-')
      .map(Number);

    const [returnYear, returnMonth, returnDay] = returnedDate
      .split('-')
      .map(Number);

    const due = Date.UTC(
      dueYear,
      dueMonth - 1,
      dueDay,
    );

    const returned = Date.UTC(
      returnYear,
      returnMonth - 1,
      returnDay,
    );

    return Math.floor(
      (returned - due) / (1000 * 60 * 60 * 24),
    );
  }
}
