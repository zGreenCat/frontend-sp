// src/hooks/useAssignments.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { areaKeys } from "./useAreas";
import { AssignManagerToArea } from "@/application/usecases/assignment/AssignManagerToArea";
import { RemoveManagerToArea } from "@/application/usecases/assignment/RemoveManagerToArea";
import { AssignWarehouseToArea } from "@/application/usecases/assignment/AssignWarehouseToArea";
import { RemoveWarehouseFromArea } from "@/application/usecases/assignment/RemoveWarehouseToArea";
import { AssignSupervisorToWarehouse } from "@/application/usecases/assignment/AssignSupervisorToWarehouse";
import { RemoveSupervisorToWarehouse } from "@/application/usecases/assignment/RemoveSupervisorToWarehouse";
import { RemoveAssignment } from "@/application/usecases/assignment/RemoveAssignment";

/**
 * ✅ NEW: Remove an assignment directly using its ID
 * This is the preferred method - no GET call needed!
 */
export const useRemoveAssignment = () => {
  const { assignmentRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      areaId,
    }: {
      assignmentId: string;
      areaId?: string; // Optional for invalidation
    }) => {
      const useCase = new RemoveAssignment(assignmentRepo);
      const result = await useCase.execute(assignmentId);

      if (!result.ok) {
        throw new Error(result.error || "Error al remover asignación");
      }

      return null;
    },
    onSuccess: (_, variables) => {
      // Invalidate area queries if areaId is provided
      if (variables.areaId) {
        queryClient.invalidateQueries({ queryKey: areaKeys.all });
        queryClient.invalidateQueries({
          queryKey: areaKeys.detail(variables.areaId),
        });
      }
      // Always invalidate general queries
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
};

/**
 * Asignar un Jefe (manager) a un área
 */
export const useAssignManager = () => {
  const { assignmentRepo } = useRepositories(); // 👈 asegúrate de exponerlo en el provider
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      areaId,
      managerId,
    }: {
      areaId: string;
      managerId: string;
    }) => {
      const useCase = new AssignManagerToArea(assignmentRepo);
      const result = await useCase.execute(areaId, managerId);

      if (!result.ok) {
        throw new Error(result.error || "Error al asignar jefe al área");
      }

      return null;
    },
    onSuccess: (_, variables) => {
      // Refrescar lista y detalle del área
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
      queryClient.invalidateQueries({
        queryKey: areaKeys.detail(variables.areaId),
      });
    },
  });
};

/**
 * ⚠️ DEPRECATED: Use useRemoveAssignment(assignmentId) instead
 * Remover un Jefe (manager) de un área
 * This hook does a GET to find the assignment ID - inefficient!
 */
export const useRemoveManager = () => {
  const { assignmentRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      areaId,
      managerId,
    }: {
      areaId: string;
      managerId: string;
    }) => {
      const useCase = new RemoveManagerToArea(assignmentRepo);
      const result = await useCase.execute(areaId, managerId);

      if (!result.ok) {
        throw new Error(result.error || "Error al remover jefe del área");
      }

      return null;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
      queryClient.invalidateQueries({
        queryKey: areaKeys.detail(variables.areaId),
      });
    },
  });
};

/**
 * Asignar una bodega a un área
 */
export const useAssignWarehouseToArea = () => {
  const { assignmentRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      areaId,
      warehouseId,
    }: {
      areaId: string;
      warehouseId: string;
    }) => {
      const useCase = new AssignWarehouseToArea(assignmentRepo);
      const result = await useCase.execute(areaId, warehouseId);

      if (!result.ok) {
        throw new Error(result.error || "Error al asignar bodega al área");
      }

      return null;
    },
    onSuccess: (_, variables) => {
      // Refrescar la lista y el detalle de áreas
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
      queryClient.invalidateQueries({
        queryKey: areaKeys.detail(variables.areaId),
      });

      // Si tienes hooks de bodegas, aquí podrías hacer:
      // queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      // queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(variables.warehouseId) });
    },
  });
};


/**
 * ⚠️ DEPRECATED: Use useRemoveAssignment(assignmentId) instead
 * Remover una bodega de un área
 * This hook does a GET to find the assignment ID - inefficient!
 */
export const useRemoveWarehouseFromArea = () => {
  const { assignmentRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      areaId,
      warehouseId,
    }: {
      areaId: string;
      warehouseId: string;
    }) => {
      const useCase = new RemoveWarehouseFromArea(assignmentRepo);
      const result = await useCase.execute(areaId, warehouseId);

      if (!result.ok) {
        throw new Error(
          result.error || "Error al remover bodega del área"
        );
      }

      return null;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.all });
      queryClient.invalidateQueries({
        queryKey: areaKeys.detail(variables.areaId),
      });
      // Mismo comentario de arriba para invalidar bodegas si quieres
    },
  });
};


/**
 * Asignar un supervisor a una bodega
 */
export const useAssignSupervisorToWarehouse = () => {
  const { assignmentRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      warehouseId,
      supervisorId,
    }: {
      warehouseId: string;
      supervisorId: string;
    }) => {
      const useCase = new AssignSupervisorToWarehouse(assignmentRepo);
      const result = await useCase.execute(warehouseId, supervisorId);

      if (!result.ok) {
        throw new Error(
          result.error || "Error al asignar supervisor a la bodega"
        );
      }

      return null;
    },
    onSuccess: (_, variables) => {
      // Aquí probablemente te interese invalidar:
      // - detalle de la bodega (si tienes warehouseKeys)
      // - alguna lista de supervisores o usuarios
      // queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      // queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(variables.warehouseId) });
    },
  });
};

/**
 * ⚠️ DEPRECATED: Use useRemoveAssignment(assignmentId) instead  
 * Remover un supervisor de una bodega
 * This hook does a GET to find the assignment ID - inefficient!
 */
export const useRemoveSupervisorFromWarehouse = () => {
  const { assignmentRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      warehouseId,
      supervisorId,
    }: {
      warehouseId: string;
      supervisorId: string;
    }) => {
      const useCase = new RemoveSupervisorToWarehouse(assignmentRepo);
      const result = await useCase.execute(warehouseId, supervisorId);

      if (!result.ok) {
        throw new Error(
          result.error || "Error al remover supervisor de la bodega"
        );
      }

      return null;
    },
    onSuccess: (_, variables) => {
      // Igual que arriba, invalida lo que te interese
      // queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      // queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(variables.warehouseId) });
    },
  });
};
