import { 
  USER_STATUS, 
  PROVIDER_STATUS, 
  PROJECT_STATUS, 
  USER_ROLES,
  PRODUCT_TYPES
} from '../constants';

/**
 * Obtiene la variante del Badge según el estado del usuario
 */
export function getUserStatusVariant(status: string): 'default' | 'destructive' | 'secondary' {
  switch (status) {
    case USER_STATUS.HABILITADO:
      return 'default'; // Verde
    case USER_STATUS.DESHABILITADO:
      return 'destructive'; // Rojo
    default:
      return 'secondary';
  }
}

/**
 * Obtiene la variante del Badge según el rol del usuario
 */
export function getUserRoleVariant(role: string): 'default' | 'secondary' | 'outline' {
  switch (role) {
    case USER_ROLES.ADMIN:
      return 'default'; // Azul primario
    case USER_ROLES.JEFE:
      return 'secondary';
    case USER_ROLES.SUPERVISOR:
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * Obtiene la variante del Badge según el estado del proveedor
 */
export function getProviderStatusVariant(status: string): 'default' | 'secondary' {
  switch (status) {
    case PROVIDER_STATUS.ACTIVO:
      return 'default'; // Verde
    case PROVIDER_STATUS.INACTIVO:
      return 'secondary'; // Gris
    default:
      return 'secondary';
  }
}

/**
 * Obtiene la variante del Badge según el estado del proyecto
 */
export function getProjectStatusVariant(status: string): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case PROJECT_STATUS.ACTIVO:
      return 'default'; // Verde
    case PROJECT_STATUS.INACTIVO:
      return 'secondary'; // Gris
    case PROJECT_STATUS.FINALIZADO:
      return 'outline'; // Azul outline
    default:
      return 'secondary';
  }
}

/**
 * Obtiene la variante del Badge según el tipo de producto
 */
export function getProductTypeVariant(type: string): 'default' | 'secondary' | 'outline' {
  switch (type) {
    case PRODUCT_TYPES.EQUIPO:
      return 'default';
    case PRODUCT_TYPES.MATERIAL:
      return 'secondary';
    case PRODUCT_TYPES.REPUESTO:
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * Obtiene el color CSS personalizado según el estado
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    HABILITADO: 'hsl(var(--success))',
    ACTIVO: 'hsl(var(--success))',
    DESHABILITADO: 'hsl(var(--destructive))',
    INACTIVO: 'hsl(var(--muted-foreground))',
    FINALIZADO: 'hsl(var(--primary))',
  };

  return statusColors[status] || 'hsl(var(--muted-foreground))';
}

/**
 * Formatea la moneda según el código
 */
export function formatCurrency(amount: number, currency: string): string {
  const formatters: Record<string, Intl.NumberFormat> = {
    CLP: new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    EUR: new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }),
  };

  return formatters[currency]?.format(amount) || `${currency} ${amount}`;
}

/**
 * Traduce el rol del usuario al español
 */
export function translateRole(role: string): string {
  const translations: Record<string, string> = {
    ADMIN: 'Administrador',
    JEFE: 'Jefe',
    SUPERVISOR: 'Supervisor',
  };

  return translations[role] || role;
}

/**
 * Traduce el tipo de producto al español
 */
export function translateProductType(type: string): string {
  const translations: Record<string, string> = {
    EQUIPO: 'Equipo',
    MATERIAL: 'Material',
    REPUESTO: 'Repuesto',
  };

  return translations[type] || type;
}
