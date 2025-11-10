import { IWarehouseRepository } from '@/domain/repositories/IWarehouseRepository';
import { Warehouse } from '@/domain/entities/Warehouse';
import { Result, success, failure } from '@/shared/types/Result';

export class GetWarehouseDetail {
  constructor(private warehouseRepo: IWarehouseRepository) {}

  async execute(id: string, tenantId: string): Promise<Result<Warehouse | null>> {
    try {
      const warehouse = await this.warehouseRepo.findById(id, tenantId);
      return success(warehouse);
    } catch {
      return failure('Error al obtener detalle de bodega');
    }
  }
}
