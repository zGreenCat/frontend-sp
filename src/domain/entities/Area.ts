export type AreaStatus = 'ACTIVO' | 'INACTIVO';

export interface Area {
  id: string;
  name: string;
  level: number;
  parentId?: string;
  status: AreaStatus;
  tenantId: string;
  nodeType?: 'ROOT' | 'CHILD';
  description?: string;
  children?: Area[];
}
