// application/usecases/assignments/RemoveWarehouseFromArea.ts
import { IAssignmentRepository } from "@/domain/repositories/IAssignmentRepository";
import { Result } from "@/shared/types/Result";

export class RemoveWarehouseFromArea {
  constructor(private assignmentsRepo: IAssignmentRepository) {}

  async execute(areaId: string, warehouseId: string): Promise<Result<void>> {
    try {
      await this.assignmentsRepo.removeWarehouseFromArea(areaId, warehouseId);

      return {
        ok: true,
        value: undefined,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || "Error al remover bodega del área",
      };
    }
  }
}
