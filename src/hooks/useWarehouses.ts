import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';
import { Warehouse } from '@/domain/entities/Warehouse';
import { CreateWarehouseInput, UpdateWarehouseInput } from '@/shared/schemas';
import { TENANT_ID } from '@/shared/constants';

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
    queryFn: () => warehouseRepo.findAll(TENANT_ID),
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
    queryFn: () => warehouseRepo.findById(warehouseId, TENANT_ID),
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
    mutationFn: (data: CreateWarehouseInput) =>
      warehouseRepo.create(data as any),
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
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateWarehouseInput> }) =>
      warehouseRepo.update(id, data as any, TENANT_ID),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(variables.id) });
    },
  });
};


