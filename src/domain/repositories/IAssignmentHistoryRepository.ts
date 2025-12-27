import { AssignmentHistoryResponse } from '../entities/AssignmentHistory';

export interface IAssignmentHistoryRepository {
  /**
   * GET /assignment-history/user/{userId}
   * Obtiene el historial de asignaciones de un usuario específico
   */
  findByUserId(
    userId: string,
    page?: number,
    limit?: number
  ): Promise<AssignmentHistoryResponse>;
}
