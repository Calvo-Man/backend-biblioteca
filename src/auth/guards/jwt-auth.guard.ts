
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// =====================================================
// GUARD DE AUTENTICACIÓN JWT
// =====================================================

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// Este guard protege las rutas que requieren autenticación.
// Passport utiliza JwtStrategy para validar el token.
//
// El token se obtiene desde la cookie HttpOnly
// llamada access_token.
//
// Si el token es válido, permite continuar la petición.
// Si no existe o es inválido, devuelve HTTP 401.
