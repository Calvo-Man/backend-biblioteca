
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { Admin } from '../admins/entities/admin.entity';
import { Student } from '../students/entities/student.entity';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    // Registra los repositorios de administradores y estudiantes.
    TypeOrmModule.forFeature([Admin, Student]),

    // Configura Passport para utilizar JWT como estrategia predeterminada.
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    // Configura JWT utilizando las variables de entorno.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Obtiene el secreto utilizado para firmar los tokens.
        const jwtSecret = configService.get<string>('JWT_SECRET');

        // Evita iniciar la aplicación si no existe el secreto.
        if (!jwtSecret) {
          throw new Error('La variable JWT_SECRET no está configurada.');
        }

        return {
          secret: jwtSecret,

          // Tiempo de expiración del token.
          signOptions: {
            expiresIn: '1d',
          },
        };
      },
    }),
  ],

  // Controlador encargado del inicio y cierre de sesión.
  controllers: [AuthController],

  providers: [
    // Servicio con la lógica de autenticación.
    AuthService,

    // Estrategia que extrae y valida el JWT desde la cookie.
    JwtStrategy,

    // Guarda que verifica si el usuario está autenticado.
    JwtAuthGuard,

    // Guarda que verifica los permisos según el rol.
    RolesGuard,
  ],

  // Permite utilizar estos módulos y guards desde otros módulos.
  exports: [
    JwtModule,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
