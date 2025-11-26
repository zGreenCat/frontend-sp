import { IAssignmentHistoryRepository } from '@/domain/repositories/IAssignmentHistoryRepository';
import { AssignmentHistoryEntry } from '@/domain/entities/AssignmentHistory';

let historyEntries: AssignmentHistoryEntry[] = [];

export class MockAssignmentHistoryRepository implements IAssignmentHistoryRepository {
  async findByUserId(userId: string, tenantId: string): Promise<AssignmentHistoryEntry[]> {
    await this.simulateLatency();
    return historyEntries
      .filter(entry => entry.userId === userId && entry.tenantId === tenantId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async create(entry: Omit<AssignmentHistoryEntry, 'id'>): Promise<AssignmentHistoryEntry> {
    await this.simulateLatency();
    const newEntry: AssignmentHistoryEntry = {
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(entry.timestamp),
    };
    historyEntries.push(newEntry);
    return newEntry;
  }

  async findRecent(tenantId: string, limit: number = 50): Promise<AssignmentHistoryEntry[]> {
    await this.simulateLatency();
    return historyEntries
      .filter(entry => entry.tenantId === tenantId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  private simulateLatency(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 200));
  }
}
