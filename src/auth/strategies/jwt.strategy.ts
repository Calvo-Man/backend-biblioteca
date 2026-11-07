
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Admin } from '../../admins/entities/admin.entity';
import { Student } from '../../students/entities/student.entity';

// =====================================================
// EXTRAER JWT DESDE UNA COOKIE
// =====================================================

const cookieExtractor = (request: any): string | null => {
  // Verificar que la petición tenga cookies disponibles.
  if (!request || !request.cookies) {
    return null;
  }

  // Obtener el JWT almacenado en la cookie HttpOnly.
  return request.cookies.access_token || null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,

    // Repositorio para comprobar administradores.
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,

    // Repositorio para comprobar estudiantes.
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {
    // Obtener el secreto JWT desde las variables de entorno.
    const jwtSecret = configService.get<string>('JWT_SECRET');

    // Evitar iniciar la aplicación sin un secreto configurado.
    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET no está configurado en el archivo .env',
      );
    }

    super({
      // Extraer el token desde la cookie access_token.
      jwtFromRequest: cookieExtractor,

      // Rechazar automáticamente los tokens expirados.
      ignoreExpiration: false,

      // Secreto utilizado para verificar la firma del JWT.
      secretOrKey: jwtSecret,
    });
  }

  // =====================================================
  // VALIDAR INFORMACIÓN DEL TOKEN
  // =====================================================

  async validate(payload: {
    sub: number;
    username: string;
    role: 'ADMIN' | 'STUDENT';
  }) {
    // Comprobar que el rol sea uno de los permitidos.
    if (
      payload.role !== 'ADMIN' &&
      payload.role !== 'STUDENT'
    ) {
      throw new UnauthorizedException(
        'Rol de usuario no válido',
      );
    }

    // Comprobar que el identificador sea válido.
    if (!Number.isInteger(payload.sub) || payload.sub <= 0) {
      throw new UnauthorizedException(
        'Token de autenticación no válido',
      );
    }

    // =================================================
    // VALIDAR ADMINISTRADOR
    // =================================================

    if (payload.role === 'ADMIN') {
      // Buscar al administrador en la base de datos.
      const admin = await this.adminRepository.findOne({
        where: {
          id: payload.sub,
          username: payload.username,
          is_active: true,
        },
      });

      // Rechazar si no existe o está desactivado.
      if (!admin) {
        throw new UnauthorizedException(
          'La sesión no es válida',
        );
      }
    }

    // =================================================
    // VALIDAR ESTUDIANTE
    // =================================================

    if (payload.role === 'STUDENT') {
      // Buscar al estudiante en la base de datos.
      const student = await this.studentRepository.findOne({
        where: {
          id: payload.sub,
          username: payload.username,
          is_active: true,
        },
      });

      // Rechazar si no existe o está desactivado.
      if (!student) {
        throw new UnauthorizedException(
          'La sesión no es válida',
        );
      }
    }

    // Los datos estarán disponibles en request.user.
    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
