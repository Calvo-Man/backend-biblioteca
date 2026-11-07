
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Loan, LoanStatus } from '../loans/entities/loan.entity';
import { Book } from '../books/entities/book.entity';
import { Copy, CopyStatus } from '../copies/entities/copy.entity';
import { Student } from '../students/entities/student.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,

    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,

    @InjectRepository(Copy)
    private readonly copyRepository: Repository<Copy>,

    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async getOverview() {
    const today = this.getTodayString();

    // Ejecutamos todas las consultas en paralelo.
    const [
      totalBooks,
      totalCopies,
      availableCopies,
      loanedCopies,
      totalStudents,
      totalLoans,
      activeLoans,
      overdueLoans,
      recentLoans,
    ] = await Promise.all([
      // Total de libros registrados.
      this.bookRepository.count(),

      // Total de ejemplares físicos.
      this.copyRepository.count(),

      // Ejemplares disponibles.
      this.copyRepository.count({
        where: { status: CopyStatus.AVAILABLE },
      }),

      // Ejemplares actualmente prestados.
      this.copyRepository.count({
        where: { status: CopyStatus.LOANED },
      }),

      // Estudiantes activos.
      this.studentRepository.count({
        where: { is_active: true },
      }),

      // Total histórico de préstamos.
      this.loanRepository.count(),

      // Préstamos que todavía no han sido devueltos.
      this.loanRepository.count({
        where: { status: LoanStatus.ACTIVE },
      }),

      // Préstamos activos cuya fecha de devolución ya pasó.
      this.loanRepository
        .createQueryBuilder('loan')
        .where('loan.status = :status', {
          status: LoanStatus.ACTIVE,
        })
        .andWhere('loan.due_date < :today', { today })
        .getCount(),

      // Últimos cinco préstamos registrados.
      this.loanRepository.find({
        select: {
          id: true,
          loan_date: true,
          due_date: true,
          status: true,
          returned_at: true,

          student: {
            id: true,
            full_name: true,
            document_number: true,
          },

          admin: {
            id: true,
            username: true,
          },

          copy: {
            id: true,
            copy_code: true,

            book: {
              id: true,
              title: true,
            },
          },
        },
        relations: {
          student: true,
          admin: true,
          copy: {
            book: true,
          },
        },
        order: {
          loan_date: 'DESC',
        },
        take: 5,
      }),
    ]);

    return {
      statistics: {
        total_books: totalBooks,
        total_copies: totalCopies,
        available_copies: availableCopies,
        loaned_copies: loanedCopies,
        total_students: totalStudents,
        total_loans: totalLoans,
        active_loans: activeLoans,
        overdue_loans: overdueLoans,
      },

      recent_loans: recentLoans,
    };
  }

  // Obtiene la fecha actual en formato YYYY-MM-DD.
  private getTodayString(): string {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
