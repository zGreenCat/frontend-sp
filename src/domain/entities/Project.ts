export type ProjectStatus = 'ACTIVO' | 'INACTIVO' | 'FINALIZADO';

export interface Project {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
  isActive?: boolean;
  productsCount: number;
  tenantId: string;
  createdAt?: string;
  updatedAt?: string;
}
