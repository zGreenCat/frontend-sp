// domain/entities/Assignment.ts
export type AssignmentType =
  | 'AREA_MANAGER'          // usuario JEFE asignado a un área
  | 'WAREHOUSE_SUPERVISOR'  // usuario SUPERVISOR asignado a una bodega
  | 'AREA_WAREHOUSE';       // bodega ligada a un área

export interface Assignment {
  id: string;
  type: AssignmentType;
  userId?: string;
  areaId?: string;
  warehouseId?: string;
  assignedAt: string;
  revokedAt?: string | null;
  isActive: boolean;
}
