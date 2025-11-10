import { IWarehouseRepository } from '@/domain/repositories/IWarehouseRepository';
import { Warehouse } from '@/domain/entities/Warehouse';
import { Result, success, failure } from '@/shared/types/Result';

export class ListWarehouses {
  constructor(private warehouseRepo: IWarehouseRepository) {}

  async execute(tenantId: string): Promise<Result<Warehouse[]>> {
    try {
      const warehouses = await this.warehouseRepo.findAll(tenantId);
      return success(warehouses);
    } catch {
      return failure('Error al listar bodegas');
    }
  }
}
