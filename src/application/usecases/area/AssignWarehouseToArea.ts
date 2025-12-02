import { IAreaRepository } from '@/domain/repositories/IAreaRepository';
import { Result } from '@/shared/types';

export class AssignWarehouseToArea {
  constructor(private areaRepo: IAreaRepository) {}

  async execute(areaId: string, warehouseId: string): Promise<Result<void>> {
    try {
      await (this.areaRepo as any).assignWarehouse(areaId, warehouseId);
      
      return {
        ok: true,
        value: undefined,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Error al asignar bodega al área',
      };
    }
  }
}
