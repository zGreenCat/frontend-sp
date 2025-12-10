import { IAssignmentRepository } from '@/domain/repositories/IAssignmentRepository';
import { Result } from '@/shared/types/Result';

export class RemoveManagerToArea {
  constructor(private assignmentsRepo: IAssignmentRepository) {}

  async execute(areaId: string, managerId: string): Promise<Result<void>> {
    try {
      await this.assignmentsRepo.removeManagerFromArea(areaId, managerId);
      return { ok: true, value: undefined };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Error al remover jefe de área',
      };
    }
  }
}
