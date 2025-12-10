// src/hooks/useAreas.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { Area } from "@/domain/entities/Area";
import { TENANT_ID } from "@/shared/constants";
import { UpdateArea } from "@/application/usecases/area/UpdateArea";

// 🔑 Query Keys centralizados
export const areaKeys = {
  all: ["areas", TENANT_ID] as const,
  detail: (id: string) => ["areas", TENANT_ID, id] as const,
};

/**
 * Obtener TODAS las áreas del tenant
 */
export const useAreas = () => {
  const { areaRepo } = useRepositories();

  return useQuery({
    queryKey: areaKeys.all,
    queryFn: () => areaRepo.findAll(TENANT_ID),
    staleTime: 5 * 60 * 1000, // 5min
  });
};

/**
 * Obtener una área por ID
 */
export const useAreaById = (areaId: string) => {
  const { areaRepo } = useRepositories();

  return useQuery({
    queryKey: areaKeys.detail(areaId),
    queryFn: () => areaRepo.findById(areaId, TENANT_ID),
    enabled: !!areaId,
  });
};

/**
 * Crear nueva área
 */
export const useCreateArea = () => {
  const { areaRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    // si más adelante quieres un use case CreateArea, acá es donde se enchufa
    mutationFn: (data: { name: string; parentId: string | null }) =>
      areaRepo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
    },
  });
};

/**
 * Actualizar un área existente (nombre / estado / lo que soporte el repo)
 */
export const useUpdateArea = () => {
  const { areaRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Area>;
    }) => {
      const useCase = new UpdateArea(areaRepo);
      const result = await useCase.execute(id, data, TENANT_ID);

      if (!result.ok || !result.value) {
        throw new Error("No se pudo actualizar el área");
      }

      return result.value; // Area actualizada
    },
    onSuccess: (updatedArea) => {
      // Invalidar lista y detalle
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
      queryClient.invalidateQueries({
        queryKey: areaKeys.detail(updatedArea.id),
      });
    },
  });
};
