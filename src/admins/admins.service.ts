import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Admin } from './entities/admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  // Crear administrador
  async create(dto: CreateAdminDto) {
    const existingAdmin = await this.adminRepository.findOne({
      where: { username: dto.username },
    });

    if (existingAdmin) {
      throw new ConflictException(
        'El nombre de usuario ya está registrado',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const admin = this.adminRepository.create({
      ...dto,
      password: hashedPassword,
    });

    const savedAdmin = await this.adminRepository.save(admin);

    return this.sanitizeAdmin(savedAdmin);
  }

  // Listar administradores con paginación y búsqueda
  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { full_name: Like(`%${search}%`) },
          { username: Like(`%${search}%`) },
        ]
      : {};

    const [admins, total] = await this.adminRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: {
        id: 'DESC',
      },
    });

    return {
      data: admins.map((admin) => this.sanitizeAdmin(admin)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Buscar administrador por ID
  async findOne(id: number) {
    const admin = await this.adminRepository.findOne({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Administrador no encontrado');
    }

    return this.sanitizeAdmin(admin);
  }

  // Actualizar administrador
  async update(id: number, dto: UpdateAdminDto) {
    const admin = await this.adminRepository.findOne({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Administrador no encontrado');
    }

    // Comprobar si el username ya pertenece a otro administrador
    if (dto.username) {
      const existingAdmin = await this.adminRepository.findOne({
        where: {
          username: dto.username,
          id: Not(id),
        },
      });

      if (existingAdmin) {
        throw new ConflictException(
          'El nombre de usuario ya está registrado',
        );
      }
    }

    // Actualizar contraseña únicamente si se proporciona
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(admin, dto);

    const updatedAdmin = await this.adminRepository.save(admin);

    return this.sanitizeAdmin(updatedAdmin);
  }

  // Activar o desactivar administrador
  async toggleStatus(id: number) {
    const admin = await this.adminRepository.findOne({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Administrador no encontrado');
    }

    admin.is_active = !admin.is_active;

    const updatedAdmin = await this.adminRepository.save(admin);

    return this.sanitizeAdmin(updatedAdmin);
  }

  // Eliminar información sensible de la respuesta
  private sanitizeAdmin(admin: Admin) {
    const { password, ...result } = admin;
    return result;
  }
}