import { IWarehouseMovementRepository } from '@/domain/repositories/IWarehouseMovementRepository';
import { WarehouseMovementsResponse } from '@/domain/entities/WarehouseMovement';
import { apiClient } from '@/infrastructure/api/apiClient';

export class ApiWarehouseMovementRepository implements IWarehouseMovementRepository {
  async getMovements(
    warehouseId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<WarehouseMovementsResponse> {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await apiClient.get<WarehouseMovementsResponse>(
        `/warehouses/${warehouseId}/movements?${queryParams.toString()}`,
        true
      );

      return response;
    } catch (error) {
      console.error('Error fetching warehouse movements:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los movimientos de una bodega sin paginación (para exportación)
   * @param warehouseId - ID de la bodega
   * @param limit - Límite máximo de registros (default 10000 para exportación masiva)
   */
  async getAllMovements(
    warehouseId: string,
    limit: number = 10000
  ): Promise<WarehouseMovementsResponse> {
    try {
      const queryParams = new URLSearchParams({
        page: '1',
        limit: limit.toString(),
      });

      const response = await apiClient.get<WarehouseMovementsResponse>(
        `/warehouses/${warehouseId}/movements?${queryParams.toString()}`,
        true
      );

      return response;
    } catch (error) {
      console.error('Error fetching all warehouse movements:', error);
      throw error;
    }
  }
}
