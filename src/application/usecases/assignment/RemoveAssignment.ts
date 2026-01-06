import { IAssignmentRepository } from '@/domain/repositories/IAssignmentRepository';
import { Result } from '@/shared/types/Result';

/**
 * ✅ NEW: Remove an assignment directly using its ID
 * This is the preferred method as it avoids the GET call to find the assignment
 */
export class RemoveAssignment {
  constructor(private assignmentsRepo: IAssignmentRepository) {}

  async execute(assignmentId: string): Promise<Result<void>> {
    try {
      if (!assignmentId) {
        return {
          ok: false,
          error: 'Assignment ID is required',
        };
      }

      await this.assignmentsRepo.removeAssignment(assignmentId);
      return { ok: true, value: undefined };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Error al remover asignación',
      };
    }
  }
}
