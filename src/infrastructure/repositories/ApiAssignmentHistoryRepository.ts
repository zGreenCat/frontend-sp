import { IAssignmentHistoryRepository } from '@/domain/repositories/IAssignmentHistoryRepository';
import { AssignmentHistoryEntry } from '@/domain/entities/AssignmentHistory';
import { apiClient } from '@/infrastructure/api/apiClient';

/**
 * Repositorio de historial de asignaciones
 * NOTA: El backend actualmente NO tiene implementados los endpoints de assignment-history.
 * Este repositorio funciona en modo degradado guardando localmente los registros hasta que
 * el backend implemente:
 * - POST /assignment-history (crear entrada)
 * - GET /assignment-history/user/{userId} (obtener por usuario)
 * - GET /assignment-history/recent (obtener recientes)
 */
export class ApiAssignmentHistoryRepository implements IAssignmentHistoryRepository {
  private readonly STORAGE_KEY = 'assignment_history_cache';
  
  /**
   * Obtiene el historial cacheado localmente
   */
  private getLocalHistory(): AssignmentHistoryEntry[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const cached = localStorage.getItem(this.STORAGE_KEY);
      if (!cached) return [];
      
      const entries = JSON.parse(cached) as AssignmentHistoryEntry[];
      return entries.map(e => ({
        ...e,
        timestamp: new Date(e.timestamp)
      }));
    } catch (error) {
      console.error('Error reading local history cache:', error);
      return [];
    }
  }
  
  /**
   * Guarda el historial en cache local
   */
  private saveLocalHistory(entries: AssignmentHistoryEntry[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving local history cache:', error);
    }
  }

  async findByUserId(userId: string, tenantId: string): Promise<AssignmentHistoryEntry[]> {
    try {
      // Intentar obtener del backend
      const response = await apiClient.get<AssignmentHistoryEntry[]>(
        `/assignment-history/user/${userId}?tenantId=${tenantId}`,
        true
      );
      return response;
    } catch (error: any) {
      // Si el endpoint no existe (404), usar cache local
      if (error?.response?.status === 404) {
        console.info('📦 Backend endpoint not available, using local cache for assignment history');
        const localHistory = this.getLocalHistory();
        return localHistory.filter(e => e.userId === userId && e.tenantId === tenantId);
      }
      
      console.error('Error fetching assignment history:', error);
      return [];
    }
  }

  async create(entry: Omit<AssignmentHistoryEntry, 'id'>): Promise<AssignmentHistoryEntry> {
    const newEntry: AssignmentHistoryEntry = {
      ...entry,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(entry.timestamp),
    };
    
    try {
      // Intentar guardar en backend
      const response = await apiClient.post<AssignmentHistoryEntry>(
        '/assignment-history',
        entry,
        true
      );
      return response;
    } catch (error: any) {
      // Si el endpoint no existe (404), guardar localmente
      if (error?.response?.status === 404) {
        console.info('📦 Backend endpoint not available, saving assignment history locally');
        const localHistory = this.getLocalHistory();
        localHistory.push(newEntry);
        
        // Mantener solo últimas 100 entradas
        if (localHistory.length > 100) {
          localHistory.splice(0, localHistory.length - 100);
        }
        
        this.saveLocalHistory(localHistory);
        return newEntry;
      }
      
      console.error('Error creating assignment history entry:', error);
      // Aún así guardar localmente como fallback
      const localHistory = this.getLocalHistory();
      localHistory.push(newEntry);
      this.saveLocalHistory(localHistory);
      return newEntry;
    }
  }

  async findRecent(tenantId: string, limit: number = 50): Promise<AssignmentHistoryEntry[]> {
    try {
      // Intentar obtener del backend
      const response = await apiClient.get<AssignmentHistoryEntry[]>(
        `/assignment-history/recent?tenantId=${tenantId}&limit=${limit}`,
        true
      );
      return response;
    } catch (error: any) {
      // Si el endpoint no existe (404), usar cache local
      if (error?.response?.status === 404) {
        console.info('📦 Backend endpoint not available, using local cache for recent history');
        const localHistory = this.getLocalHistory();
        return localHistory
          .filter(e => e.tenantId === tenantId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
      }
      
      console.error('Error fetching recent assignment history:', error);
      return [];
    }
  }
}
