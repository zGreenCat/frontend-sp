export type WarehouseStatus = 'ACTIVO' | 'INACTIVO';

export interface Warehouse {
  id: string;
  name: string;
  maxCapacityKg: number; // Alineado con backend (antes: capacityKg)
  isEnabled: boolean; // Alineado con backend (antes: status)
  areaId?: string;
  supervisorId?: string;
  tenantId?: string;
  currentCapacityKg?: number; // capacidad ocupada actual (opcional)
  createdAt?: string;
  updatedAt?: string;
  
  // Computed properties para retrocompatibilidad
  get status(): WarehouseStatus;
  capacityKg?: number; // deprecated: usar maxCapacityKg
}
