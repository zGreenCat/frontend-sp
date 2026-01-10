import { WarehouseMovementsResponse } from '../entities/WarehouseMovement';

export interface IWarehouseMovementRepository {
  getMovements(warehouseId: string, page?: number, limit?: number): Promise<WarehouseMovementsResponse>;
  getAllMovements(warehouseId: string, limit?: number): Promise<WarehouseMovementsResponse>;
}
