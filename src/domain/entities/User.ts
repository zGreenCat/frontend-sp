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
  assignmentHistory?: AssignmentHistoryEntry[];
  tenantId: string;
}
