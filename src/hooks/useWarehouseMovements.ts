import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';

export const warehouseMovementKeys = {
  all: (warehouseId: string) => ['warehouse-movements', warehouseId] as const,
  paginated: (warehouseId: string, page: number, limit: number) => 
    ['warehouse-movements', warehouseId, page, limit] as const,
};

/**
 * Hook para obtener movimientos de una bodega específica con paginación
 * @param warehouseId - ID de la bodega
 * @param page - Número de página (default 1)
 * @param limit - Cantidad de registros por página (default 10)
 */
export const useWarehouseMovements = (
  warehouseId: string,
  page: number = 1,
  limit: number = 10
) => {
  const { warehouseMovementRepo } = useRepositories();

  return useQuery({
    queryKey: warehouseMovementKeys.paginated(warehouseId, page, limit),
    queryFn: () => warehouseMovementRepo.getMovements(warehouseId, page, limit),
    enabled: !!warehouseId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};
