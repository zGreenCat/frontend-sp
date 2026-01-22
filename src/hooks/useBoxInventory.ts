import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';
import { BoxEquipment } from '@/domain/entities/BoxEquipment';
import { BoxMaterial } from '@/domain/entities/BoxMaterial';
import { TENANT_ID } from '@/shared/constants';
import { AddEquipmentToBox } from '@/application/usecases/box/AddEquipmentToBox';
import { AddMaterialToBox } from '@/application/usecases/box/AddMaterialToBox';
import { RemoveEquipmentFromBox } from '@/application/usecases/box/RemoveEquipmentFromBox';
import { RemoveMaterialFromBox } from '@/application/usecases/box/RemoveMaterialFromBox';
import { boxKeys } from './useBoxes';

/**
 * Hook para gestionar el inventario de una caja (equipos y materiales).
 * 
 * NOTA: Para LEER el inventario de una caja, usa `useBoxById(boxId)`.
 * El backend devuelve `equipments` y `materials` dentro del objeto Box,
 * por lo que no necesitas un endpoint o query separado.
 * 
 * Este hook expone solo las mutaciones para agregar/remover items.
 */

// ========== EQUIPOS ==========

/**
 * Mutation para agregar un equipo a una caja
 * Invalida el detalle de la caja y el listado
 */
export const useAddBoxEquipment = () => {
  const { boxRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boxId,
      equipmentId,
      quantity,
      reason,
    }: {
      boxId: string;
      equipmentId: string;
      quantity: number;
      reason?: string;
    }): Promise<BoxEquipment> => {
      const useCase = new AddEquipmentToBox(boxRepo);
      return await useCase.execute(boxId, { equipmentId, quantity, reason }, TENANT_ID);
    },
    onSuccess: (_, variables) => {
      // Invalidar el detalle de la caja afectada
      queryClient.invalidateQueries({ queryKey: boxKeys.detail(variables.boxId) });
      // Invalidar listado de cajas (por si afecta filtros o estado)
      queryClient.invalidateQueries({ queryKey: ['boxes', TENANT_ID] });
    },
  });
};

/**
 * Mutation para remover un equipo de una caja
 * Invalida el detalle de la caja y el listado
 */
export const useRemoveBoxEquipment = () => {
  const { boxRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boxId,
      assignmentId,
      reason,
    }: {
      boxId: string;
      assignmentId: string;
      reason?: string;
    }): Promise<void> => {
      const useCase = new RemoveEquipmentFromBox(boxRepo);
      await useCase.execute(boxId, assignmentId, TENANT_ID, reason);
    },
    onSuccess: (_, variables) => {
      // Invalidar el detalle de la caja afectada
      queryClient.invalidateQueries({ queryKey: boxKeys.detail(variables.boxId) });
      // Invalidar listado de cajas
      queryClient.invalidateQueries({ queryKey: ['boxes', TENANT_ID] });
    },
  });
};

// ========== MATERIALES ==========

/**
 * Mutation para agregar un material a una caja
 * Invalida el detalle de la caja y el listado
 */
export const useAddBoxMaterial = () => {
  const { boxRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boxId,
      materialId,
      quantity,
      reason,
    }: {
      boxId: string;
      materialId: string;
      quantity: number;
      reason?: string;
    }): Promise<BoxMaterial> => {
      const useCase = new AddMaterialToBox(boxRepo);
      return await useCase.execute(boxId, { materialId, quantity, reason }, TENANT_ID);
    },
    onSuccess: (_, variables) => {
      // Invalidar el detalle de la caja afectada
      queryClient.invalidateQueries({ queryKey: boxKeys.detail(variables.boxId) });
      // Invalidar listado de cajas
      queryClient.invalidateQueries({ queryKey: ['boxes', TENANT_ID] });
    },
  });
};

/**
 * Mutation para remover un material de una caja
 * Invalida el detalle de la caja y el listado
 */
export const useRemoveBoxMaterial = () => {
  const { boxRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boxId,
      assignmentId,
      reason,
    }: {
      boxId: string;
      assignmentId: string;
      reason?: string;
    }): Promise<void> => {
      const useCase = new RemoveMaterialFromBox(boxRepo);
      await useCase.execute(boxId, assignmentId, TENANT_ID, reason);
    },
    onSuccess: (_, variables) => {
      // Invalidar el detalle de la caja afectada
      queryClient.invalidateQueries({ queryKey: boxKeys.detail(variables.boxId) });
      // Invalidar listado de cajas
      queryClient.invalidateQueries({ queryKey: ['boxes', TENANT_ID] });
    },
  });
};
