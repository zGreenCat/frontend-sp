import { AssignmentHistoryEntry } from './AssignmentHistory';

export type UserRole = 'ADMIN' | 'JEFE' | 'SUPERVISOR';
export type UserStatus = 'HABILITADO' | 'DESHABILITADO';

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
  assignmentHistory?: AssignmentHistoryEntry[];
  tenantId: string;
}
