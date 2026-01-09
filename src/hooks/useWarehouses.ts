import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';
import { Warehouse } from '@/domain/entities/Warehouse';
import { WarehouseSupervisor } from '@/domain/entities/WarehouseSupervisor';
import { PaginatedResponse } from '@/domain/repositories/IWarehouseRepository';
import { CreateWarehouseInput, UpdateWarehouseInput } from '@/shared/schemas';
import { TENANT_ID } from '@/shared/constants';
import { CreateWarehouse } from '@/application/usecases/warehouse/CreateWarehouse';
import { UpdateWarehouse } from '@/application/usecases/warehouse/UpdateWarehouse';
import { ListWarehouses } from '@/application/usecases/warehouse/ListWarehouses';
import { GetWarehouseDetail } from '@/application/usecases/warehouse/GetWarehouseDetail';
import { ListWarehouseSupervisors } from '@/application/usecases/warehouse/ListWarehouseSupervisors';

// Query Keys
export const warehouseKeys = {
  all: ['warehouses', TENANT_ID] as const,
  byArea: (areaId: string) => ['warehouses', TENANT_ID, 'area', areaId] as const,
  detail: (id: string) => ['warehouses', TENANT_ID, id] as const,
};

export const warehouseSupervisorKeys = {
  list: (warehouseId: string, page: number, limit: number) =>
    ['warehouse-supervisors', TENANT_ID, warehouseId, page, limit] as const,
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

/**
 * Hook para obtener supervisores asignados a una bodega (paginado)
 * GET /warehouses/{warehouseId}/supervisors?page=1&limit=10
 */
export const useWarehouseSupervisors = (
  warehouseId: string,
  page: number = 1,
  limit: number = 10
) => {
  const { warehouseRepo } = useRepositories();

  return useQuery({
    queryKey: warehouseSupervisorKeys.list(warehouseId, page, limit),
    queryFn: async (): Promise<PaginatedResponse<WarehouseSupervisor>> => {
      const useCase = new ListWarehouseSupervisors(warehouseRepo);
      const result = await useCase.execute(warehouseId, page, limit);

      if (!result.ok) {
        throw new Error(result.error);
      }

      return result.value;
    },
    enabled: !!warehouseId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

