
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { Admin } from '../admins/entities/admin.entity';
import { Student } from '../students/entities/student.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    // Repositorio para consultar administradores.
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,

    // Repositorio para consultar estudiantes.
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,

    // Servicio encargado de generar los tokens JWT.
    private readonly jwtService: JwtService,
  ) {}

  // =====================================================
  // INICIO DE SESIÓN DE ADMINISTRADOR
  // =====================================================

  async adminLogin(dto: LoginDto) {
    // Busca al administrador mediante su nombre de usuario.
    // addSelect recupera la contraseña aunque tenga select: false.
    const admin = await this.adminRepository
      .createQueryBuilder('admin')
      .addSelect('admin.password')
      .where('admin.username = :username', {
        username: dto.username,
      })
      .getOne();

    // Comprueba que exista y que su cuenta esté activa.
    if (!admin || !admin.is_active) {
      throw new UnauthorizedException(
        'Usuario o contraseña incorrectos',
      );
    }

    // Verifica la contraseña ingresada contra el hash almacenado.
    const passwordMatch = await bcrypt.compare(
      dto.password,
      admin.password,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException(
        'Usuario o contraseña incorrectos',
      );
    }

    // Genera el token con el rol de administrador.
    return this.generateToken(
      admin.id,
      admin.username,
      'ADMIN',
    );
  }

  // =====================================================
  // INICIO DE SESIÓN DE ESTUDIANTE
  // =====================================================

  async studentLogin(dto: LoginDto) {
    // Busca al estudiante mediante su nombre de usuario.
    const student = await this.studentRepository
      .createQueryBuilder('student')
      .addSelect('student.password')
      .where('student.username = :username', {
        username: dto.username,
      })
      .getOne();

    // Comprueba que exista y que su cuenta esté activa.
    if (!student || !student.is_active) {
      throw new UnauthorizedException(
        'Usuario o contraseña incorrectos',
      );
    }

    // Verifica la contraseña ingresada contra el hash almacenado.
    const passwordMatch = await bcrypt.compare(
      dto.password,
      student.password,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException(
        'Usuario o contraseña incorrectos',
      );
    }

    // Genera el token con el rol de estudiante.
    return this.generateToken(
      student.id,
      student.username,
      'STUDENT',
    );
  }

  // =====================================================
  // GENERACIÓN DEL TOKEN JWT
  // =====================================================

  private async generateToken(
    id: number,
    username: string,
    role: 'ADMIN' | 'STUDENT',
  ) {
    // Datos que quedarán almacenados dentro del JWT.
    const payload = {
      sub: id,
      username,
      role,
    };

    // Firma el token utilizando la configuración de JwtModule.
    const accessToken = await this.jwtService.signAsync(payload);

    // Devuelve el token al controlador para establecer la cookie.
    // El controlador nunca envía el JWT en el cuerpo de la respuesta.
    return {
      access_token: accessToken,
      user: {
        id,
        username,
        role,
      },
    };
  }
}
