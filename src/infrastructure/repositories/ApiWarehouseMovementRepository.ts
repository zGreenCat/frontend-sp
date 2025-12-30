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
}
