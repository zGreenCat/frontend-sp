// src/infrastructure/repositories/ApiUserEnablementHistoryRepository.ts

import { apiClient } from '../api/apiClient';
import {
  IUserEnablementHistoryRepository,
  GetEnablementHistoryFilters,
} from '@/domain/repositories/IUserEnablementHistoryRepository';
import {
  UserEnablementHistoryEntry,
  UserEnablementHistoryResponse,
  UserInfo,
} from '@/domain/entities/UserEnablementHistory';

export class ApiUserEnablementHistoryRepository
  implements IUserEnablementHistoryRepository
{
  async findByUser(
    userId: string,
    page: number = 1,
    limit?: number
  ): Promise<UserEnablementHistoryResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());

      const response = await apiClient.get<any>(
        `/users/${userId}/enablement-history?${params.toString()}`,
        true
      );

      return this.mapResponse(response);
    } catch (error) {
      console.error('Error fetching user enablement history:', error);
      throw error;
    }
  }

  async findAll(
    filters?: GetEnablementHistoryFilters
  ): Promise<UserEnablementHistoryResponse> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        if (filters.userId) params.append('userId', filters.userId);
        if (filters.performedById)
          params.append('performedById', filters.performedById);
        if (filters.action) params.append('action', filters.action);
        if (filters.from) params.append('from', filters.from.toISOString());
        if (filters.to) params.append('to', filters.to.toISOString());
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
      }

      const response = await apiClient.get<any>(
        `/enablement-history?${params.toString()}`,
        true
      );

      return this.mapResponse(response);
    } catch (error) {
      console.error('Error fetching enablement history:', error);
      throw error;
    }
  }

  private mapResponse(response: any): UserEnablementHistoryResponse {
    return {
      data: (response.data || []).map((item: any) => this.mapEntry(item)),
      page: response.page || 1,
      limit: response.limit !== undefined ? response.limit : null,
      total: response.total || 0,
    };
  }

  private mapEntry = (data: any): UserEnablementHistoryEntry => {
    return {
      id: data.id,
      userId: data.userId,
      action: data.action as 'ENABLED' | 'DISABLED',
      performedById: data.performedById,
      reason: data.reason || null,
      occurredAt: new Date(data.occurredAt),
      user: data.user ? this.mapUserInfo(data.user) : undefined,
      performer: data.performer ? this.mapUserInfo(data.performer) : undefined,
    };
  }

  private mapUserInfo = (data: any): UserInfo => {
    return {
      id: data.id,
      email: data.email,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
    };
  }
}
