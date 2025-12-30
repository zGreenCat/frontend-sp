export type MovementType = 'ADJUSTMENT' | 'IN' | 'OUT' | 'TRANSFER' | 'INVENTORY';

export interface WarehouseMovement {
  id: string;
  warehouseId: string;
  warehouseName: string;
  movementType: MovementType;
  boxCode: string | null;
  quantity: number;
  referenceDocument: string | null;
  notes: string | null;
  performedById: string;
  performedByName: string;
  occurredAt: string;
  createdAt: string;
}

export interface WarehouseMovementsResponse {
  data: WarehouseMovement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
