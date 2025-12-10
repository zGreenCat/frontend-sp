import { IAssignmentRepository } from '@/domain/repositories/IAssignmentRepository';
import { Result } from '@/shared/types/Result';

export class AssignWarehouseToArea {
  constructor(private assignmentsRepo: IAssignmentRepository) {}

  async execute(areaId: string, warehouseId: string): Promise<Result<void>> {
    try {
      await this.assignmentsRepo.assignWarehouseToArea(areaId, warehouseId);
      return { ok: true, value: undefined };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Error al asignar bodega al área',
      };
    }
  }
}
