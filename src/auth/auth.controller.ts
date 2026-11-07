
import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';

import type { Response } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // =====================================================
  // LOGIN DE ADMINISTRADOR
  // =====================================================

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Valida las credenciales y genera el JWT.
    const result = await this.authService.adminLogin(dto);

    // Guarda el JWT en una cookie HttpOnly.
    this.setAuthCookie(res, result.access_token);

    // Devuelve únicamente los datos públicos del usuario.
    return {
      message: 'Inicio de sesión de administrador exitoso',
      user: result.user,
    };
  }

  // =====================================================
  // LOGIN DE ESTUDIANTE
  // =====================================================

  @Post('student/login')
  @HttpCode(HttpStatus.OK)
  async studentLogin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Valida las credenciales y genera el JWT.
    const result = await this.authService.studentLogin(dto);

    // Guarda el JWT en una cookie HttpOnly.
    this.setAuthCookie(res, result.access_token);

    return {
      message: 'Inicio de sesión de estudiante exitoso',
      user: result.user,
    };
  }

  // =====================================================
  // CERRAR SESIÓN
  // =====================================================

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    // Elimina la cookie utilizando las mismas opciones
    // de identificación con las que fue creada.
    res.clearCookie('access_token', this.getCookieOptions());

    return {
      message: 'Sesión cerrada correctamente',
    };
  }

  // Consultar los datos del usuario autenticado.
  // El JWT se obtiene automáticamente desde la cookie HttpOnly.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: any) {
    return {
      user: req.user,
    };
  }

  // =====================================================
  // CREAR COOKIE DE AUTENTICACIÓN
  // =====================================================

  private setAuthCookie(res: Response, token: string) {
    res.cookie('access_token', token, {
      ...this.getCookieOptions(),

      // Duración de la cookie: 24 horas.
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  // =====================================================
  // OPCIONES COMPARTIDAS DE LA COOKIE
  // =====================================================

  private getCookieOptions() {
    return {
      // Impide que JavaScript pueda leer el JWT.
      httpOnly: true,

      // Exige HTTPS en producción.
      secure: process.env.NODE_ENV === 'production',

      // Restringe el envío de cookies entre sitios.
      sameSite: 'lax' as const,

      // La cookie estará disponible en toda la aplicación.
      path: '/',
    };
  }
}
