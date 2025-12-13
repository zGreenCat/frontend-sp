export type WarehouseStatus = 'ACTIVO' | 'INACTIVO';

export interface Warehouse {
  id: string;
  name: string;
  capacityKg: number;
  status: WarehouseStatus;
  areaId?: string;
  supervisorId?: string;
  tenantId: string;
  currentCapacityKg?: number; // capacidad ocupada actual (opcional)
}
