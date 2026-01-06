export type WarehouseStatus = 'ACTIVO' | 'INACTIVO';

export interface Warehouse {
  id: string;
  name: string;
  maxCapacityKg: number; // Alineado con backend (antes: capacityKg)
  isEnabled: boolean; // Alineado con backend (antes: status)
  areaId?: string;
  areaName?: string; // ✅ Nombre del área asignada (desde backend)
  supervisorId?: string;
  tenantId?: string;
  currentCapacityKg?: number; // capacidad ocupada actual (opcional)
  createdAt?: string;
  updatedAt?: string;
  assignmentId?: string; // ID de la asignación (cuando viene del detalle de área)
  assignmentIsActive?: boolean; // Estado de la asignación área-bodega (true/false)
  
  // Computed properties para retrocompatibilidad
  get status(): WarehouseStatus;
  capacityKg?: number; // deprecated: usar maxCapacityKg
}
