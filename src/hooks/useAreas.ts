import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';
import { Area } from '@/domain/entities/Area';
import { TENANT_ID } from '@/shared/constants';

// Query Keys
export const areaKeys = {
  all: ['areas', TENANT_ID] as const,
  detail: (id: string) => ['areas', TENANT_ID, id] as const,
};

/**
 * Hook para obtener todas las áreas del tenant
 * Caché compartido entre componentes
 */
export const useAreas = () => {
  const { areaRepo } = useRepositories();

  return useQuery({
    queryKey: areaKeys.all,
    queryFn: () => areaRepo.findAll(TENANT_ID),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener una área específica por ID
 * @param areaId - ID del área a buscar
 */
export const useAreaById = (areaId: string) => {
  const { areaRepo } = useRepositories();

  return useQuery({
    queryKey: areaKeys.detail(areaId),
    queryFn: () => areaRepo.findById(areaId, TENANT_ID),
    enabled: !!areaId, // Solo ejecutar si hay areaId
  });
};

/**
 * Mutation para crear una nueva área
 * Invalida automáticamente la caché de áreas
 */
export const useCreateArea = () => {
  const { areaRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; parentId: string | null }) =>
      areaRepo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
    },
  });
};

/**
 * Mutation para actualizar un área existente
 * Invalida caché del área específica y lista completa
 */
export const useUpdateArea = () => {
  const { areaRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Area> }) =>
      areaRepo.update(id, data, TENANT_ID),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
      queryClient.invalidateQueries({ queryKey: areaKeys.detail(variables.id) });
    },
  });
};

/**
 * Mutation para asignar un manager a un área
 * Invalida la caché del área específica
 */
export const useAssignManager = () => {
  const { areaRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ areaId, managerId }: { areaId: string; managerId: string }) =>
      areaRepo.assignManager(areaId, managerId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
      queryClient.invalidateQueries({ queryKey: areaKeys.detail(variables.areaId) });
    },
  });
};

/**
 * Mutation para remover un manager de un área
 * Invalida la caché del área específica
 */
export const useRemoveManager = () => {
  const { areaRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ areaId, managerId }: { areaId: string; managerId: string }) =>
      areaRepo.removeManager(areaId, managerId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
      queryClient.invalidateQueries({ queryKey: areaKeys.detail(variables.areaId) });
    },
  });
};
