
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Loan, LoanStatus } from './entities/loan.entity';
import { Student } from '../students/entities/student.entity';
import { Admin } from '../admins/entities/admin.entity';
import { Copy, CopyStatus } from '../copies/entities/copy.entity';

import { CreateLoanDto } from './dto/create-loan.dto';
import { FindLoansDto } from './dto/find-loans.dto';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,

    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,

    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,

    @InjectRepository(Copy)
    private readonly copyRepository: Repository<Copy>,

    private readonly dataSource: DataSource,
  ) {}

  // Registrar un préstamo mediante el documento del estudiante.
  // El ID del administrador se obtiene del token desde el controlador.
  async create(dto: CreateLoanDto, adminId: number) {
    return this.dataSource.transaction(async (manager) => {
      const studentRepo = manager.getRepository(Student);
      const adminRepo = manager.getRepository(Admin);
      const copyRepo = manager.getRepository(Copy);
      const loanRepo = manager.getRepository(Loan);

      const admin = await adminRepo.findOne({
        where: {
          id: adminId,
          is_active: true,
        },
      });

      if (!admin) {
        throw new NotFoundException(
          'No se encontró el administrador autenticado.',
        );
      }

      const student = await studentRepo
        .createQueryBuilder('student')
        .setLock('pessimistic_write')
        .where('student.document_number = :document', {
          document: dto.student_document,
        })
        .getOne();

      if (!student) {
        throw new NotFoundException(
          'No se encontró un estudiante con ese número de documento.',
        );
      }

      if (!student.is_active) {
        throw new BadRequestException('El estudiante se encuentra inactivo.');
      }

      const activeLoans = await loanRepo.count({
        where: {
          student_id: student.id,
          status: LoanStatus.ACTIVE,
        },
      });

      if (activeLoans >= 8) {
        throw new BadRequestException(
          'El estudiante ya alcanzó el máximo de 8 préstamos activos.',
        );
      }

      const copy = await copyRepo
        .createQueryBuilder('copy')
        .setLock('pessimistic_write')
        .where('copy.id = :id', { id: dto.copy_id })
        .getOne();

      if (!copy) {
        throw new NotFoundException('No se encontró el ejemplar solicitado.');
      }

      if (copy.status !== CopyStatus.AVAILABLE) {
        throw new ConflictException(
          'El ejemplar no está disponible para préstamo.',
        );
      }

      const loanDate = this.getTodayString();
      const dueDate = this.calculateDueDate(loanDate, dto.loan_days);

      const loan = loanRepo.create({
        student_id: student.id,
        copy_id: copy.id,
        admin_id: admin.id,
        loan_date: loanDate,
        due_date: dueDate,
        status: LoanStatus.ACTIVE,
        returned_at: null,
      });

      const savedLoan = await loanRepo.save(loan);

      copy.status = CopyStatus.LOANED;
      await copyRepo.save(copy);

      return {
        message: 'Préstamo registrado correctamente.',
        loan: savedLoan,
      };
    });
  }

  // Consultar todos los préstamos con filtros y paginación global.
  async findAll(filters: FindLoansDto) {
    const {
      page = 1,
      limit = 10,
      status,
      student_document,
      search,
    } = filters;

    const query = this.loanRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.student', 'student')
      .leftJoinAndSelect('loan.admin', 'admin')
      .leftJoinAndSelect('loan.copy', 'copy')
      .leftJoinAndSelect('copy.book', 'book');

    // Los vencidos siguen teniendo estado ACTIVE.
    // Se filtran por fecha directamente en la base de datos.
    if (status === 'OVERDUE') {
      query
        .andWhere('loan.status = :activeStatus', {
          activeStatus: LoanStatus.ACTIVE,
        })
        .andWhere('loan.due_date < CURRENT_DATE()');
    } else if (status) {
      query.andWhere('loan.status = :status', { status });
    }

    if (student_document) {
      query.andWhere('student.document_number = :student_document', {
        student_document,
      });
    }

    if (search) {
      query.andWhere(
        `(
          student.full_name LIKE :search
          OR student.document_number LIKE :search
          OR copy.copy_code LIKE :search
          OR book.title LIKE :search
        )`,
        { search: `%${search}%` },
      );
    }

    query
      .orderBy('loan.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [loans, total] = await query.getManyAndCount();

    return {
      data: loans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Consultar un préstamo por su ID.
  async findOne(id: number) {
    const loan = await this.loanRepository.findOne({
      where: { id },
      relations: {
        student: true,
        admin: true,
        copy: {
          book: true,
        },
      },
    });

    if (!loan) {
      throw new NotFoundException('No se encontró el préstamo solicitado.');
    }

    return loan;
  }

  // Consultar los préstamos de un estudiante mediante su documento.
  async findByStudentDocument(documentNumber: string) {
    const student = await this.studentRepository.findOne({
      where: {
        document_number: documentNumber,
      },
    });

    if (!student) {
      throw new NotFoundException(
        'No se encontró un estudiante con ese número de documento.',
      );
    }

    return this.getStudentLoans(student.id);
  }

  // Consultar los préstamos propios usando el ID obtenido del token.
  async findMyLoans(studentId: number) {
    const student = await this.studentRepository.findOne({
      where: {
        id: studentId,
        is_active: true,
      },
    });

    if (!student) {
      throw new NotFoundException('No se encontró el estudiante autenticado.');
    }

    return this.getStudentLoans(studentId);
  }

  // Obtener préstamos y estadísticas de un estudiante.
  private async getStudentLoans(studentId: number) {
    const loans = await this.loanRepository.find({
      where: {
        student_id: studentId,
      },
      relations: {
        copy: {
          book: true,
        },
        admin: true,
      },
      order: {
        created_at: 'DESC',
      },
    });

    const today = this.getTodayString();

    const active = loans.filter((loan) => loan.status === LoanStatus.ACTIVE);

    const overdue = active.filter((loan) => loan.due_date < today);

    return {
      total: loans.length,
      active: active.length,
      overdue: overdue.length,
      loans,
    };
  }

  // Obtener la fecha actual en formato YYYY-MM-DD.
  private getTodayString(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Calcular la fecha límite según los días seleccionados.
  private calculateDueDate(loanDate: string, loanDays: number): string {
    const [year, month, day] = loanDate.split('-').map(Number);

    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + loanDays);

    const dueYear = date.getFullYear();
    const dueMonth = String(date.getMonth() + 1).padStart(2, '0');
    const dueDay = String(date.getDate()).padStart(2, '0');

    return `${dueYear}-${dueMonth}-${dueDay}`;
  }
}
