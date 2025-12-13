// src/domain/repositories/IUserEnablementHistoryRepository.ts

import {
  UserEnablementHistoryEntry,
  UserEnablementHistoryResponse,
  EnablementAction,
} from '../entities/UserEnablementHistory';

export interface GetEnablementHistoryFilters {
  userId?: string;
  performedById?: string;
  action?: EnablementAction;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export interface IUserEnablementHistoryRepository {
  /**
   * Obtiene el historial de habilitación de un usuario específico
   * GET /users/{userId}/enablement-history
   */
  findByUser(
    userId: string,
    page?: number,
    limit?: number
  ): Promise<UserEnablementHistoryResponse>;

  /**
   * Obtiene el historial global de habilitación (solo Admin)
   * GET /enablement-history
   */
  findAll(
    filters?: GetEnablementHistoryFilters
  ): Promise<UserEnablementHistoryResponse>;
}
