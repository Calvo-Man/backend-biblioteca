
import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { ROLES_KEY, UserRole } from '../decorators/roles.decorator';

// Estructura de los datos que JwtStrategy coloca en request.user.
interface AuthenticatedUser {
  id: number;
  username: string;
  role: UserRole;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtiene los roles permitidos para el método o controlador.
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no se especifican roles, no se restringe el acceso por rol.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Obtiene la solicitud HTTP y el usuario autenticado por JWT.
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();

    const user = request.user;

    // Si no existe un usuario autenticado, deniega el acceso.
    if (!user) {
      return false;
    }

    // Comprueba que el rol del usuario esté entre los permitidos.
    return requiredRoles.includes(user.role);
  }
}
