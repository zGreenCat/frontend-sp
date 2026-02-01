import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';

/**
 * Hook para obtener todas las categorías de materiales activas
 */
export function useMaterialCategories() {
  const { materialCategoryRepo } = useRepositories();

  return useQuery({
    queryKey: ['material-categories'],
    queryFn: () => materialCategoryRepo.findAll(),
    staleTime: 10 * 60 * 1000, // 10 minutos de cache
    gcTime: 60 * 60 * 1000, // 1 hora en cache
  });
}
