export type ProjectStatus = 'ACTIVO' | 'INACTIVO' | 'FINALIZADO';

export interface Project {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
  productsCount: number;
  tenantId: string;
}
