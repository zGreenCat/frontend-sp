export type AreaStatus = 'ACTIVO' | 'INACTIVO';

export interface Area {
  id: string;
  name: string;
  level: number;
  parentId?: string;
  status: AreaStatus;
  tenantId: string;
}
