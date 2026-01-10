import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';

export const warehouseMovementKeys = {
  all: (warehouseId: string) => ['warehouse-movements', warehouseId] as const,
  paginated: (warehouseId: string, page: number, limit: number) => 
    ['warehouse-movements', warehouseId, page, limit] as const,
  export: (warehouseId: string) => ['warehouse-movements', warehouseId, 'export'] as const,
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

/**
 * Hook para obtener todos los movimientos de una bodega (para exportación CSV)
 * @param warehouseId - ID de la bodega
 * @param enabled - Si debe ejecutar la query (default false, se activa manualmente)
 * @param limit - Límite máximo de registros (default 10000)
 */
export const useAllWarehouseMovements = (
  warehouseId: string,
  enabled: boolean = false,
  limit: number = 10000
) => {
  const { warehouseMovementRepo } = useRepositories();

  return useQuery({
    queryKey: warehouseMovementKeys.export(warehouseId),
    queryFn: () => warehouseMovementRepo.getAllMovements(warehouseId, limit),
    enabled: enabled && !!warehouseId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
  });
};
