import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';
import { Box, HistoryEvent } from '@/domain/entities/Box';
import { CreateBoxInput, UpdateBoxInput, MoveBoxInput, ChangeBoxStatusInput } from '@/shared/schemas';
import { BoxListFilters, BoxListResponse, HistoryFilters, HistoryResponse } from '@/domain/repositories/IBoxRepository';
import { TENANT_ID } from '@/shared/constants';
import { CreateBox } from '@/application/usecases/box/CreateBox';
import { UpdateBox } from '@/application/usecases/box/UpdateBox';
import { ListBoxes } from '@/application/usecases/box/ListBoxes';
import { GetBoxDetail } from '@/application/usecases/box/GetBoxDetail';
import { MoveBox } from '@/application/usecases/box/MoveBox';
import { ChangeBoxStatus } from '@/application/usecases/box/ChangeBoxStatus';
import { DeactivateBox } from '@/application/usecases/box/DeactivateBox';
import { FindBoxByQr } from '@/application/usecases/box/FindBoxByQr';
import { GetBoxHistory } from '@/application/usecases/box/GetBoxHistory';

// Query Keys
export const boxKeys = {
  all: (filters?: BoxListFilters) => ['boxes', TENANT_ID, filters] as const,
  detail: (id: string) => ['boxes', TENANT_ID, 'detail', id] as const,
  history: (id: string, filters?: HistoryFilters) => ['boxes', TENANT_ID, 'history', id, filters] as const,
};

/**
 * Hook para obtener todas las cajas con filtros y paginación
 * @param filters - Filtros opcionales: page, limit, search (qrCode), status
 */
export const useBoxes = (filters?: BoxListFilters) => {
  const { boxRepo } = useRepositories();

  return useQuery({
    queryKey: boxKeys.all(filters),
    queryFn: async (): Promise<BoxListResponse> => {
      const useCase = new ListBoxes(boxRepo);
      const result = await useCase.execute(TENANT_ID, filters);
      
      if (!result.ok) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener una caja específica por ID
 * @param boxId - ID de la caja a buscar
 */
export const useBoxById = (boxId: string) => {
  const { boxRepo } = useRepositories();

  return useQuery({
    queryKey: boxKeys.detail(boxId),
    queryFn: async (): Promise<Box | null> => {
      const useCase = new GetBoxDetail(boxRepo);
      const result = await useCase.execute(boxId, TENANT_ID);
      
      if (!result.ok) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    enabled: !!boxId,
  });
};

/**
 * Hook para obtener historial de una caja con filtros
 * @param boxId - ID de la caja
 * @param filters - Filtros: page, limit, eventType
 */
export const useBoxHistory = (boxId: string, filters?: HistoryFilters) => {
  const { boxRepo } = useRepositories();

  return useQuery({
    queryKey: boxKeys.history(boxId, filters),
    queryFn: async (): Promise<HistoryResponse> => {
      const useCase = new GetBoxHistory(boxRepo);
      const result = await useCase.execute(boxId, TENANT_ID, filters);
      
      if (!result.ok) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    enabled: !!boxId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

/**
 * Hook para buscar una caja por código QR
 */
export const useFindBoxByQr = () => {
  const { boxRepo } = useRepositories();

  return useMutation({
    mutationFn: async (qrCode: string): Promise<Box | null> => {
      const useCase = new FindBoxByQr(boxRepo);
      const result = await useCase.execute(qrCode, TENANT_ID);
      
      if (!result.ok) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
  });
};

/**
 * Mutation para crear una nueva caja
 * Invalida automáticamente la caché de cajas
 */
export const useCreateBox = () => {
  const { boxRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBoxInput): Promise<Box> => {
      const useCase = new CreateBox(boxRepo);
      const result = await useCase.execute(data, TENANT_ID);
      
      if (!result.ok) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    onSuccess: () => {
      // Invalidar todas las queries de listado de cajas
      queryClient.invalidateQueries({ queryKey: ['boxes', TENANT_ID] });
    },
  });
};

/**
 * Mutation para actualizar una caja existente
 * Invalida caché de la caja específica y lista completa
 */
export const useUpdateBox = () => {
  const { boxRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBoxInput }): Promise<Box> => {
      const useCase = new UpdateBox(boxRepo);
      const result = await useCase.execute(id, data, TENANT_ID);
      
      if (!result.ok) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boxes', TENANT_ID] });
      queryClient.invalidateQueries({ queryKey: boxKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['boxes', TENANT_ID, 'history', variables.id] });
    },
  });
};

/**
 * Mutation para mover una caja entre bodegas
 */
export const useMoveBox = () => {
  const { boxRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, warehouseId }: { id: string; warehouseId: string }): Promise<Box> => {
      const useCase = new MoveBox(boxRepo);
      const result = await useCase.execute(id, { targetWarehouseId: warehouseId }, TENANT_ID);
      
      if (!result.ok) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boxes', TENANT_ID] });
      queryClient.invalidateQueries({ queryKey: boxKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['boxes', TENANT_ID, 'history', variables.id] });
    },
  });
};

/**
 * Mutation para cambiar el estado de una caja
 */
export const useChangeBoxStatus = () => {
  const { boxRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }): Promise<Box> => {
      const useCase = new ChangeBoxStatus(boxRepo);
      const result = await useCase.execute(id, { status }, TENANT_ID);
      
      if (!result.ok) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boxes', TENANT_ID] });
      queryClient.invalidateQueries({ queryKey: boxKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['boxes', TENANT_ID, 'history', variables.id] });
    },
  });
};

/**
 * Mutation para desactivar una caja (baja lógica)
 */
export const useDeactivateBox = () => {
  const { boxRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<Box> => {
      const useCase = new DeactivateBox(boxRepo);
      const result = await useCase.execute(id, TENANT_ID);
      
      if (!result.ok) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['boxes', TENANT_ID] });
      queryClient.invalidateQueries({ queryKey: boxKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['boxes', TENANT_ID, 'history', id] });
    },
  });
};
