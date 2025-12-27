import { AssignmentHistoryEntry } from './AssignmentHistory';

export type UserRole = 'ADMIN' | 'JEFE' | 'SUPERVISOR';
export type UserStatus = 'HABILITADO' | 'DESHABILITADO';

export interface AreaAssignment {
  id: string;
  name: string;
}

export interface WarehouseAssignment {
  id: string;
  name: string;
}

// Información completa de asignación de área (del backend)
export interface AreaAssignmentDetail {
  id: string; // ID de la asignación
  userId: string;
  areaId: string;
  assignedBy: string;
  assignedAt: string;
  revokedAt: string | null;
  isActive: boolean;
  area: {
    id: string;
    name: string;
    nodeType: string;
    level: number;
    isActive: boolean;
  };
}

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  rut: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  areas: string[];
  warehouses: string[];
  areaDetails?: AreaAssignment[];
  warehouseDetails?: WarehouseAssignment[];
  areaAssignments?: AreaAssignmentDetail[]; // Info completa de asignaciones
  assignmentHistory?: AssignmentHistoryEntry[];
  tenantId: string;
  reason?: string; // Razón del último cambio de estado
}

export interface ValidateUserUniqueInput {
  rut?: string;
  email?: string;
}

export interface ValidateUserUniqueResult {
  rutAvailable?: boolean;
  emailAvailable?: boolean;
  isValid: boolean;
}