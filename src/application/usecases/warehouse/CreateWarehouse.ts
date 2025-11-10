import { IWarehouseRepository } from '@/domain/repositories/IWarehouseRepository';
import { Warehouse } from '@/domain/entities/Warehouse';
import { Result, success, failure } from '@/shared/types/Result';

export class CreateWarehouse {
  constructor(private warehouseRepo: IWarehouseRepository) {}

  async execute(warehouseData: Omit<Warehouse, 'id'>): Promise<Result<Warehouse>> {
    try {
      const warehouse = await this.warehouseRepo.create(warehouseData);
      return success(warehouse);
    } catch {
      return failure('Error al crear bodega');
    }
  }
}
