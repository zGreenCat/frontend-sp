// application/usecases/assignments/AssignManagerToArea.ts
import { IAssignmentRepository } from "@/domain/repositories/IAssignmentRepository";
import { Result } from "@/shared/types/Result";

export class AssignSupervisorToWarehouse {
  constructor(private assignmentRepo: IAssignmentRepository) {}

  async execute(warehouseId: string, supervisorId: string): Promise<Result<void>> {
    try {
      await this.assignmentRepo.assignSupervisorToWarehouse(warehouseId, supervisorId);
      return { ok: true, value: undefined };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || "Error al asignar jefe al área",
      };
    }
  }
}
