export const TENANT_ID = 'kreatech-demo';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  USERS: '/users',
  AREAS: '/areas',
  WAREHOUSES: '/warehouses',
  BOXES: '/boxes',
  PRODUCTS: '/products',
  PROVIDERS: '/providers',
  PROJECTS: '/projects',
} as const;

// Kreatech Brand Colors (HEX)
export const KREATECH_COLORS = {
  PRIMARY: '#2196F3',        // Azul Kreatech
  SUCCESS: '#4CAF50',        // Verde éxito
  BACKGROUND: '#FFFFFF',     // Blanco
  SURFACE: '#E0E0E0',        // Gris claro
  TEXT_PRIMARY: '#333333',   // Negro suave
  TEXT_SECONDARY: '#666666', // Gris medio
} as const;

// User Status
export const USER_STATUS = {
  HABILITADO: 'HABILITADO',
  DESHABILITADO: 'DESHABILITADO',
} as const;

// User Roles (Frontend)
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  JEFE: 'JEFE',
  SUPERVISOR: 'SUPERVISOR',
} as const;

// Mapeo entre roles del Backend y Frontend
export const BACKEND_ROLE_MAP: Record<string, string> = {
  // Backend -> Frontend
  'ADMIN': 'ADMIN',
  'JEFE_AREA': 'JEFE',
  'SUPERVISOR': 'SUPERVISOR',
  'BODEGUERO': 'SUPERVISOR', // BODEGUERO del backend se mapea a SUPERVISOR
  // Frontend -> Backend
  'JEFE': 'JEFE_AREA',
};

// Helper para convertir rol del backend al frontend
export const mapBackendRoleToFrontend = (backendRole: string): string => {
  return BACKEND_ROLE_MAP[backendRole] || backendRole;
};

// Helper para convertir rol del frontend al backend
export const mapFrontendRoleToBackend = (frontendRole: string): string => {
  // ADMIN se mapea a sí mismo, JEFE a JEFE_AREA, SUPERVISOR a SUPERVISOR
  if (frontendRole === 'ADMIN') return 'ADMIN';
  if (frontendRole === 'JEFE') return 'JEFE_AREA';
  if (frontendRole === 'SUPERVISOR') return 'SUPERVISOR';
  return frontendRole;
};

// Provider Status
export const PROVIDER_STATUS = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
} as const;

// Project Status
export const PROJECT_STATUS = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
  FINALIZADO: 'FINALIZADO',
} as const;

// Product Types
export const PRODUCT_TYPES = {
  EQUIPO: 'EQUIPO',
  MATERIAL: 'MATERIAL',
  REPUESTO: 'REPUESTO',
} as const;

// Area Levels
export const AREA_LEVELS = {
  PRINCIPAL: 'PRINCIPAL',
  DEPENDIENTE: 'DEPENDIENTE',
} as const;

// Box Types (según backend)
export const BOX_TYPES = {
  PEQUEÑA: 'PEQUEÑA',
  NORMAL: 'NORMAL',
  GRANDE: 'GRANDE',
} as const;

// Box Status (según backend real)
export const BOX_STATUS = {
  DISPONIBLE: 'DISPONIBLE',
  EN_REPARACION: 'EN_REPARACION',
  DANADA: 'DANADA',
  RETIRADA: 'RETIRADA',
} as const;

// Currency
export const CURRENCIES = {
  CLP: 'CLP',
  USD: 'USD',
  EUR: 'EUR',
} as const;

// Badge Variants by Status
export const STATUS_BADGE_VARIANTS = {
  HABILITADO: 'default',
  DESHABILITADO: 'destructive',
  ACTIVO: 'default',
  INACTIVO: 'secondary',
  FINALIZADO: 'secondary',
} as const;
