import { useAuth } from '@/hooks/use-auth';
import { Permission } from '@/shared/permissions';

/**
 * Hook personalizado para verificar permisos del usuario autenticado
 * Proporciona una interfaz sencilla para control de acceso basado en roles
 */
export function usePermissions() {
  const { user, hasPermission } = useAuth();

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param permission - El permiso a verificar
   * @returns true si el usuario tiene el permiso, false en caso contrario
   */
  const can = (permission: Permission): boolean => {
    return hasPermission(permission);
  };

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   * @param permissions - Array de permisos a verificar
   * @returns true si el usuario tiene todos los permisos, false en caso contrario
   */
  const canAll = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.every(permission => hasPermission(permission));
  };

  /**
   * Verifica si el usuario tiene al menos uno de los permisos especificados
   * @param permissions - Array de permisos a verificar
   * @returns true si el usuario tiene al menos un permiso, false en caso contrario
   */
  const canAny = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.some(permission => hasPermission(permission));
  };

  /**
   * Verifica si el usuario es administrador
   * @returns true si el usuario tiene rol de ADMIN
   */
  const isAdmin = (): boolean => {
    if (!user || !user.role) return false;
    return user.role.name === 'ADMIN' || user.roleId === 'ADMIN';
  };

  /**
   * Verifica si el usuario es jefe
   * @returns true si el usuario tiene rol de JEFE
   */
  const isManager = (): boolean => {
    if (!user || !user.role) return false;
    return user.role.name === 'JEFE' || user.roleId === 'JEFE';
  };

  /**
   * Verifica si el usuario es supervisor
   * @returns true si el usuario tiene rol de SUPERVISOR
   */
  const isSupervisor = (): boolean => {
    if (!user || !user.role) return false;
    return user.role.name === 'SUPERVISOR' || user.roleId === 'SUPERVISOR';
  };

  return {
    can,
    canAll,
    canAny,
    isAdmin,
    isManager,
    isSupervisor,
    user,
  };
}
