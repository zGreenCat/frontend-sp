import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';
import { Warehouse } from '@/domain/entities/Warehouse';
import { CreateWarehouseInput, UpdateWarehouseInput } from '@/shared/schemas';
import { TENANT_ID } from '@/shared/constants';
import { CreateWarehouse } from '@/application/usecases/warehouse/CreateWarehouse';
import { UpdateWarehouse } from '@/application/usecases/warehouse/UpdateWarehouse';
import { ListWarehouses } from '@/application/usecases/warehouse/ListWarehouses';
import { GetWarehouseDetail } from '@/application/usecases/warehouse/GetWarehouseDetail';

// Query Keys
export const warehouseKeys = {
  all: ['warehouses', TENANT_ID] as const,
  byArea: (areaId: string) => ['warehouses', TENANT_ID, 'area', areaId] as const,
  detail: (id: string) => ['warehouses', TENANT_ID, id] as const,
};

/**
 * Hook para obtener todos los warehouses del tenant
 * Caché compartido entre componentes
 */
export const useWarehouses = () => {
  const { warehouseRepo } = useRepositories();

  return useQuery({
    queryKey: warehouseKeys.all,
    queryFn: async (): Promise<Warehouse[]> => {
      const useCase = new ListWarehouses(warehouseRepo);
      const result = await useCase.execute(TENANT_ID);
      
      if (!result.ok) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener warehouses por área específica
 * @param areaId - ID del área para filtrar warehouses
 */
export const useWarehousesByArea = (areaId: string) => {
  const { data: warehouses, ...rest } = useWarehouses();

  return {
    data: warehouses?.filter((w) => w.areaId === areaId),
    ...rest,
  };
};

/**
 * Hook para obtener un warehouse específico por ID
 * @param warehouseId - ID del warehouse a buscar
 */
export const useWarehouseById = (warehouseId: string) => {
  const { warehouseRepo } = useRepositories();

  return useQuery({
    queryKey: warehouseKeys.detail(warehouseId),
    queryFn: async (): Promise<Warehouse | null> => {
      const useCase = new GetWarehouseDetail(warehouseRepo);
      const result = await useCase.execute(warehouseId, TENANT_ID);
      
      if (!result.ok) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    enabled: !!warehouseId,
  });
};

/**
 * Mutation para crear un nuevo warehouse
 * Invalida automáticamente la caché de warehouses
 */
export const useCreateWarehouse = () => {
  const { warehouseRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWarehouseInput): Promise<Warehouse> => {
      const useCase = new CreateWarehouse(warehouseRepo);
      const result = await useCase.execute(data as any);
      
      if (!result.ok) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
    },
  });
};

/**
 * Mutation para actualizar un warehouse existente
 * Invalida caché del warehouse específico y lista completa
 */
export const useUpdateWarehouse = () => {
  const { warehouseRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UpdateWarehouseInput> }): Promise<Warehouse> => {
      const useCase = new UpdateWarehouse(warehouseRepo);
      const result = await useCase.execute(id, data as any, TENANT_ID);
      
      if (!result.ok) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(variables.id) });
    },
  });
};


