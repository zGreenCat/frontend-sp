import { IAssignmentHistoryRepository } from '@/domain/repositories/IAssignmentHistoryRepository';
import { AssignmentHistoryEntry } from '@/domain/entities/AssignmentHistory';
import { apiClient } from '@/infrastructure/api/apiClient';

export class ApiAssignmentHistoryRepository implements IAssignmentHistoryRepository {
  async findByUserId(userId: string, tenantId: string): Promise<AssignmentHistoryEntry[]> {
    try {
      // TODO: Backend debe implementar GET /assignment-history/user/{userId}
      console.warn('GET /assignment-history/user/{userId} not implemented in backend, returning empty array');
      return [];
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      return [];
    }
  }

  async create(entry: Omit<AssignmentHistoryEntry, 'id'>): Promise<AssignmentHistoryEntry> {
    try {
      // TODO: Backend debe implementar POST /assignment-history
      console.warn('POST /assignment-history not implemented in backend, returning mock entry');
      return {
        ...entry,
        id: Date.now().toString(),
        timestamp: new Date(entry.timestamp),
      };
    } catch (error) {
      console.error('Error creating assignment history entry:', error);
      throw error;
    }
  }

  async findRecent(tenantId: string, limit: number = 50): Promise<AssignmentHistoryEntry[]> {
    try {
      // TODO: Backend debe implementar GET /assignment-history/recent
      console.warn('GET /assignment-history/recent not implemented in backend, returning empty array');
      return [];
    } catch (error) {
      console.error('Error fetching recent assignment history:', error);
      return [];
    }
  }
}
