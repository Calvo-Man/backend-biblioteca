import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  // Crear estudiante
  async create(dto: CreateStudentDto) {
    const existingStudent = await this.studentRepository.findOne({
      where: [
        { username: dto.username },
        { document_number: dto.document_number },
      ],
    });

    if (existingStudent) {
      if (existingStudent.username === dto.username) {
        throw new ConflictException(
          'El nombre de usuario ya está registrado',
        );
      }

      throw new ConflictException(
        'El número de documento ya está registrado',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const student = this.studentRepository.create({
      ...dto,
      password: hashedPassword,
    });

    const savedStudent = await this.studentRepository.save(student);

    return this.sanitizeStudent(savedStudent);
  }

  // Listar estudiantes con paginación y búsqueda
  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { full_name: Like(`%${search}%`) },
          { username: Like(`%${search}%`) },
          { document_number: Like(`%${search}%`) },
        ]
      : {};

    const [students, total] =
      await this.studentRepository.findAndCount({
        where,
        skip,
        take: limit,
        order: {
          id: 'DESC',
        },
      });

    return {
      data: students.map((student) =>
        this.sanitizeStudent(student),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Buscar estudiante por ID
  async findOne(id: number) {
    const student = await this.studentRepository.findOne({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    return this.sanitizeStudent(student);
  }

  // Actualizar estudiante
  async update(id: number, dto: UpdateStudentDto) {
    const student = await this.studentRepository.findOne({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    // Comprobar username duplicado
    if (dto.username) {
      const existingUsername = await this.studentRepository.findOne({
        where: {
          username: dto.username,
          id: Not(id),
        },
      });

      if (existingUsername) {
        throw new ConflictException(
          'El nombre de usuario ya está registrado',
        );
      }
    }

    // Comprobar documento duplicado
    if (dto.document_number) {
      const existingDocument = await this.studentRepository.findOne({
        where: {
          document_number: dto.document_number,
          id: Not(id),
        },
      });

      if (existingDocument) {
        throw new ConflictException(
          'El número de documento ya está registrado',
        );
      }
    }

    const updateData = { ...dto };

    // Cifrar nueva contraseña si fue proporcionada
    if (updateData.password) {
      updateData.password = await bcrypt.hash(
        updateData.password,
        10,
      );
    }

    Object.assign(student, updateData);

    const updatedStudent =
      await this.studentRepository.save(student);

    return this.sanitizeStudent(updatedStudent);
  }

  // Activar o desactivar estudiante
  async toggleStatus(id: number) {
    const student = await this.studentRepository.findOne({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    student.is_active = !student.is_active;

    const updatedStudent =
      await this.studentRepository.save(student);

    return this.sanitizeStudent(updatedStudent);
  }

  // Eliminar información sensible
  private sanitizeStudent(student: Student) {
    const { password, ...result } = student;
    return result;
  }
}