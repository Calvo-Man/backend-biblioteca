
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Loan, LoanStatus } from '../loans/entities/loan.entity';
import { Book } from '../books/entities/book.entity';
import { Copy, CopyStatus } from '../copies/entities/copy.entity';
import { Student } from '../students/entities/student.entity';

@Injectable()
export class ReportsService {
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

  // Obtener la fecha actual en formato YYYY-MM-DD.
  private getTodayString(): string {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Resumen general de la biblioteca.
  async getSummary() {
    const today = this.getTodayString();

    const [
      totalBooks,
      totalCopies,
      availableCopies,
      loanedCopies,
      totalStudents,
      totalLoans,
      activeLoans,
      overdueLoans,
    ] = await Promise.all([
      this.bookRepository.count(),

      this.copyRepository.count(),

      this.copyRepository.count({
        where: { status: CopyStatus.AVAILABLE },
      }),

      this.copyRepository.count({
        where: { status: CopyStatus.LOANED },
      }),

      // Contar solamente estudiantes activos.
      this.studentRepository.count({
        where: { is_active: true },
      }),

      this.loanRepository.count(),

      this.loanRepository.count({
        where: { status: LoanStatus.ACTIVE },
      }),

      // Préstamos activos cuya fecha límite ya pasó.
      this.loanRepository
        .createQueryBuilder('loan')
        .where('loan.status = :status', {
          status: LoanStatus.ACTIVE,
        })
        .andWhere('loan.due_date < :today', { today })
        .getCount(),
    ]);

    return {
      total_books: totalBooks,
      total_copies: totalCopies,
      available_copies: availableCopies,
      loaned_copies: loanedCopies,
      total_students: totalStudents,
      total_loans: totalLoans,
      active_loans: activeLoans,
      overdue_loans: overdueLoans,
    };
  }

  // Consultar préstamos vencidos.
  async getOverdueLoans() {
    const today = this.getTodayString();

    const loans = await this.loanRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.student', 'student')
      .leftJoinAndSelect('loan.admin', 'admin')
      .leftJoinAndSelect('loan.copy', 'copy')
      .leftJoinAndSelect('copy.book', 'book')
      .where('loan.status = :status', {
        status: LoanStatus.ACTIVE,
      })
      .andWhere('loan.due_date < :today', { today })
      .orderBy('loan.due_date', 'ASC')
      .getMany();

    return {
      total: loans.length,
      data: loans,
    };
  }

  // Consultar los 10 libros con mayor cantidad de préstamos.
  async getMostBorrowedBooks() {
    const books = await this.loanRepository
      .createQueryBuilder('loan')
      .innerJoin('loan.copy', 'copy')
      .innerJoin('copy.book', 'book')
      .select('book.id', 'book_id')
      .addSelect('book.title', 'title')
      .addSelect('COUNT(loan.id)', 'total_loans')
      .groupBy('book.id')
      .addGroupBy('book.title')
      .orderBy('total_loans', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      total: books.length,
      data: books,
    };
  }

  // Consultar el historial completo de préstamos.
  // Incluye las observaciones registradas durante la devolución.
  async getLoanHistory() {
    const loans = await this.loanRepository.find({
      relations: {
        student: true,
        admin: true,
        copy: {
          book: true,
        },
      },
      order: {
        created_at: 'DESC',
      },
    });

    return {
      total: loans.length,
      data: loans,
    };
  }
}
