import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';

// Query keys
export const assignmentHistoryKeys = {
  all: ['assignment-history'] as const,
  byUser: (userId: string) => [...assignmentHistoryKeys.all, 'user', userId] as const,
};

/**
 * Hook para obtener el historial de asignaciones de un usuario específico
 * 
 * @example
 * const { data, isLoading } = useAssignmentHistory('user-id-123');
 */
export const useAssignmentHistory = (
  userId: string,
  page: number = 1,
  limit?: number,
  options?: { enabled?: boolean }
) => {
  const { assignmentHistoryRepo } = useRepositories();

  return useQuery({
    queryKey: assignmentHistoryKeys.byUser(userId),
    queryFn: () => assignmentHistoryRepo.findByUserId(userId, page, limit),
    enabled: options?.enabled !== false && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
