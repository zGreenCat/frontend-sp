import { IWarehouseRepository, PaginatedResponse } from '@/domain/repositories/IWarehouseRepository';
import { WarehouseSupervisor } from '@/domain/entities/WarehouseSupervisor';
import { Result } from '@/shared/types/Result';

/**
 * Use case: Obtener lista paginada de supervisores asignados a una bodega
 * Endpoint: GET /warehouses/{warehouseId}/supervisors?page=1&limit=10
 */
export class ListWarehouseSupervisors {
  constructor(private warehouseRepo: IWarehouseRepository) {}

  async execute(
    warehouseId: string,
    page: number,
    limit: number
  ): Promise<Result<PaginatedResponse<WarehouseSupervisor>>> {
    return this.warehouseRepo.listWarehouseSupervisors(warehouseId, { page, limit });
  }
}
