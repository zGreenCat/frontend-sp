import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/infrastructure/api/apiClient';
import { AssignmentHistoryEntry } from '@/domain/entities/AssignmentHistory';

export const areaHistoryKeys = {
  all: ['area-history'] as const,
  byArea: (areaId: string) => [...areaHistoryKeys.all, 'area', areaId] as const,
};

/**
 * Hook para obtener el historial de un área específica
 * (asignaciones de jefes y bodegas)
 */
export const useAreaHistory = (areaId: string) => {
  return useQuery({
    queryKey: areaHistoryKeys.byArea(areaId),
    queryFn: async () => {
      const response = await apiClient.get<any>(
        `/areas/${areaId}/history`,
        true
      );
      
      // El backend ya devuelve el formato correcto
      return (response.data || response).map((entry: any) => ({
        id: entry.id,
        userId: entry.userId,
        entityId: entry.entityId,
        entityName: entry.entityName || 'Unknown',
        entityType: entry.entityType as 'AREA' | 'WAREHOUSE',
        action: entry.action as 'ASSIGNED' | 'REMOVED',
        performedById: entry.performedById,
        performedByName: entry.performedByName || 'Unknown',
        performedByEmail: entry.performedByEmail || '',
        timestamp: new Date(entry.timestamp || entry.createdAt),
        revokedAt: entry.revokedAt ? new Date(entry.revokedAt) : null,
        isActive: entry.isActive ?? true,
      })) as AssignmentHistoryEntry[];
    },
    enabled: !!areaId,
    staleTime: 1000 * 60 * 5,
  });
};
