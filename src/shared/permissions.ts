import { USER_ROLES } from './constants';

// Tipos de permisos disponibles en el sistema
export const PERMISSIONS = {
  // Usuarios
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  
  // Áreas
  AREAS_VIEW: 'areas:view',
  AREAS_CREATE: 'areas:create',
  AREAS_EDIT: 'areas:edit',
  AREAS_DELETE: 'areas:delete',
  
  // Bodegas
  WAREHOUSES_VIEW: 'warehouses:view',
  WAREHOUSES_CREATE: 'warehouses:create',
  WAREHOUSES_EDIT: 'warehouses:edit',
  WAREHOUSES_DELETE: 'warehouses:delete',
  
  // Cajas
  BOXES_VIEW: 'boxes:view',
  BOXES_CREATE: 'boxes:create',
  BOXES_EDIT: 'boxes:edit',
  BOXES_DELETE: 'boxes:delete',
  BOXES_EXPORT: 'boxes:export',
  
  // Productos
  PRODUCTS_VIEW: 'products:view',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_EDIT: 'products:edit',
  PRODUCTS_DELETE: 'products:delete',
  PRODUCTS_IMPORT: 'products:import',
  
  // Proveedores
  PROVIDERS_VIEW: 'providers:view',
  PROVIDERS_CREATE: 'providers:create',
  PROVIDERS_EDIT: 'providers:edit',
  PROVIDERS_DELETE: 'providers:delete',
  
  // Proyectos
  PROJECTS_VIEW: 'projects:view',
  PROJECTS_CREATE: 'projects:create',
  PROJECTS_EDIT: 'projects:edit',
  PROJECTS_DELETE: 'projects:delete',
  PROJECTS_FINALIZE: 'projects:finalize',
  
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_METRICS: 'dashboard:metrics',
  
  // Configuración
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Permisos por rol
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  [USER_ROLES.ADMIN]: [
    // Administrador tiene todos los permisos
    ...Object.values(PERMISSIONS),
  ],
  
  [USER_ROLES.JEFE]: [
    // Jefe puede ver todo y gestionar su área
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_METRICS,
    
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    
    PERMISSIONS.AREAS_VIEW,
    PERMISSIONS.AREAS_EDIT,
    
    PERMISSIONS.WAREHOUSES_VIEW,
    PERMISSIONS.WAREHOUSES_CREATE,
    PERMISSIONS.WAREHOUSES_EDIT,
    
    PERMISSIONS.BOXES_VIEW,
    PERMISSIONS.BOXES_CREATE,
    PERMISSIONS.BOXES_EDIT,
    PERMISSIONS.BOXES_EXPORT,
    
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.PRODUCTS_IMPORT,
    
    PERMISSIONS.PROVIDERS_VIEW,
    PERMISSIONS.PROVIDERS_CREATE,
    PERMISSIONS.PROVIDERS_EDIT,
    
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.PROJECTS_FINALIZE,
  ],
  
  [USER_ROLES.SUPERVISOR]: [
    // Supervisor solo puede ver y editar items básicos
    PERMISSIONS.DASHBOARD_VIEW,
    
    // Supervisor NO tiene acceso al módulo de usuarios
    
    PERMISSIONS.AREAS_VIEW,
    
    PERMISSIONS.WAREHOUSES_VIEW,
    
    PERMISSIONS.BOXES_VIEW,
    PERMISSIONS.BOXES_CREATE,
    PERMISSIONS.BOXES_EDIT,
    
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    
    PERMISSIONS.PROVIDERS_VIEW,
    
    PERMISSIONS.PROJECTS_VIEW,
  ],
};

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Verifica si un rol tiene todos los permisos especificados
 */
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Verifica si un rol tiene al menos uno de los permisos especificados
 */
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Obtiene todos los permisos de un rol
 */
export function getRolePermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
