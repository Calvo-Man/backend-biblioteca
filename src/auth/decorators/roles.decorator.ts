
import { SetMetadata } from '@nestjs/common';

// Clave utilizada por RolesGuard para identificar los roles requeridos.
export const ROLES_KEY = 'roles';

// Roles disponibles dentro del sistema.
export type UserRole = 'ADMIN' | 'STUDENT';

// Decorador que permite establecer qué roles pueden acceder a una ruta.
// Ejemplo: @Roles('ADMIN')
export const Roles = (...roles: UserRole[]) =>
  SetMetadata(ROLES_KEY, roles);
