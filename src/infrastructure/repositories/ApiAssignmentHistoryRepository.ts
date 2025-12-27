import { apiClient } from '../api/apiClient';
import { IAssignmentHistoryRepository } from '@/domain/repositories/IAssignmentHistoryRepository';
import {
  AssignmentHistoryEntry,
  AssignmentHistoryResponse,
} from '@/domain/entities/AssignmentHistory';

export class ApiAssignmentHistoryRepository implements IAssignmentHistoryRepository {
  async findByUserId(
    userId: string,
    page: number = 1,
    limit?: number
  ): Promise<AssignmentHistoryResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());

      const response = await apiClient.get<any>(
        `/assignment-history/user/${userId}?${params.toString()}`,
        true
      );

      return this.mapResponse(response);
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      throw error;
    }
  }

  private mapResponse(response: any): AssignmentHistoryResponse {
    return {
      data: (response.data || []).map(this.mapEntry),
      total: response.total || 0,
      page: response.page || 1,
      limit: response.limit || null,
      totalPages: response.totalPages || 1,
      hasNext: response.hasNext || false,
      hasPrev: response.hasPrev || false,
    };
  }

  private mapEntry = (data: any): AssignmentHistoryEntry => {
    return {
      id: data.id,
      userId: data.userId,
      entityId: data.entityId,
      entityName: data.entityName || 'Unknown',
      entityType: data.entityType as 'AREA' | 'WAREHOUSE',
      action: data.action as 'ASSIGNED' | 'REMOVED',
      performedById: data.performedById,
      performedByName: data.performedByName || 'Unknown',
      performedByEmail: data.performedByEmail || '',
      timestamp: new Date(data.timestamp),
      revokedAt: data.revokedAt ? new Date(data.revokedAt) : null,
      isActive: data.isActive ?? true,
    };
  };
}
