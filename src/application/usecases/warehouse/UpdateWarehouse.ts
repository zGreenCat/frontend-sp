import { IWarehouseRepository } from '@/domain/repositories/IWarehouseRepository';
import { Warehouse } from '@/domain/entities/Warehouse';
import { Result, success, failure } from '@/shared/types/Result';

export class UpdateWarehouse {
  constructor(private warehouseRepo: IWarehouseRepository) {}

  async execute(id: string, updates: Partial<Warehouse>, tenantId: string): Promise<Result<Warehouse>> {
    try {
      const warehouse = await this.warehouseRepo.update(id, updates, tenantId);
      return success(warehouse);
    } catch {
      return failure('Error al actualizar bodega');
    }
  }
}
