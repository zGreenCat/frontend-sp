// application/usecases/assignments/AssignManagerToArea.ts
import { IAssignmentRepository } from "@/domain/repositories/IAssignmentRepository";
import { Result } from "@/shared/types/Result";

export class AssignManagerToArea {
  constructor(private assignmentRepo: IAssignmentRepository) {}

  async execute(areaId: string, managerId: string): Promise<Result<void>> {
    try {
      await this.assignmentRepo.assignManagerToArea(areaId, managerId);
      return { ok: true, value: undefined };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || "Error al asignar jefe al área",
      };
    }
  }
}
