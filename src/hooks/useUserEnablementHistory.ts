// src/hooks/useUserEnablementHistory.ts

import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';
import { GetEnablementHistoryFilters } from '@/domain/repositories/IUserEnablementHistoryRepository';

// Query keys
export const userEnablementHistoryKeys = {
  all: ['user-enablement-history'] as const,
  byUser: (userId: string) => [...userEnablementHistoryKeys.all, 'user', userId] as const,
  global: (filters?: GetEnablementHistoryFilters) => 
    [...userEnablementHistoryKeys.all, 'global', filters] as const,
};

/**
 * Hook para obtener el historial de habilitación de un usuario específico
 * 
 * @example
 * const { data, isLoading } = useUserEnablementHistory('user-id-123');
 */
export const useUserEnablementHistory = (
  userId: string,
  page: number = 1,
  limit?: number,
  options?: { enabled?: boolean }
) => {
  const { userEnablementHistoryRepo } = useRepositories();

  return useQuery({
    queryKey: userEnablementHistoryKeys.byUser(userId),
    queryFn: () => userEnablementHistoryRepo.findByUser(userId, page, limit),
    enabled: options?.enabled !== false && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

/**
 * Hook para obtener el historial global de habilitación (solo Admin)
 * 
 * @example
 * const { data, isLoading } = useGlobalEnablementHistory({
 *   action: 'DISABLED',
 *   from: new Date('2024-01-01')
 * });
 */
export const useGlobalEnablementHistory = (
  filters?: GetEnablementHistoryFilters,
  options?: { enabled?: boolean }
) => {
  const { userEnablementHistoryRepo } = useRepositories();

  return useQuery({
    queryKey: userEnablementHistoryKeys.global(filters),
    queryFn: () => userEnablementHistoryRepo.findAll(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
