import { AssignmentHistoryEntry } from '@/domain/entities/AssignmentHistory';

export interface IAssignmentHistoryRepository {
  findByUserId(userId: string, tenantId: string): Promise<AssignmentHistoryEntry[]>;
  create(entry: Omit<AssignmentHistoryEntry, 'id'>): Promise<AssignmentHistoryEntry>;
  findRecent(tenantId: string, limit?: number): Promise<AssignmentHistoryEntry[]>;
}
