import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';
import { TENANT_ID } from '@/shared/constants';
import { projectKeys } from '@/hooks/useProjects';

import {
  ProjectEquipmentAssignment,
  ProjectSparePartAssignment,
  ProjectMaterialAssignment,
  AssignEquipmentDTO,
  UpdateEquipmentQtyDTO,
  AssignSparePartDTO,
  UpdateSparePartQtyDTO,
  AssignMaterialDTO,
  UpdateMaterialQtyDTO,
} from '@/domain/repositories/IProjectRepository';

import { GetProjectEquipments } from '@/application/usecases/project/GetProjectEquipments';
import { AssignProjectEquipment } from '@/application/usecases/project/AssignProjectEquipment';
import { UpdateProjectEquipmentQty } from '@/application/usecases/project/UpdateProjectEquipmentQty';
import { RemoveProjectEquipment } from '@/application/usecases/project/RemoveProjectEquipment';

import { GetProjectSpareParts } from '@/application/usecases/project/GetProjectSpareParts';
import { AssignProjectSparePart } from '@/application/usecases/project/AssignProjectSparePart';
import { UpdateProjectSparePartQty } from '@/application/usecases/project/UpdateProjectSparePartQty';
import { RemoveProjectSparePart } from '@/application/usecases/project/RemoveProjectSparePart';

import { GetProjectMaterials } from '@/application/usecases/project/GetProjectMaterials';
import { AssignProjectMaterial } from '@/application/usecases/project/AssignProjectMaterial';
import { UpdateProjectMaterialQty } from '@/application/usecases/project/UpdateProjectMaterialQty';
import { RemoveProjectMaterial } from '@/application/usecases/project/RemoveProjectMaterial';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const projectProductKeys = {
  equipments: (projectId: string) =>
    ['projects', TENANT_ID, projectId, 'equipments'] as const,
  spareParts: (projectId: string) =>
    ['projects', TENANT_ID, projectId, 'spare-parts'] as const,
  materials: (projectId: string) =>
    ['projects', TENANT_ID, projectId, 'materials'] as const,
};

// Helper: 409 → mensaje amigable
function mapMutationError(error: unknown): Error {
  const e = error as any;
  if (e?.statusCode === 409 || e?.message?.toLowerCase().includes('duplicate') || e?.message?.toLowerCase().includes('ya')) {
    return new Error('DUPLICATE');
  }
  return new Error(e?.message || 'Error desconocido');
}

// ─── Equipments ───────────────────────────────────────────────────────────────

export const useProjectEquipments = (projectId: string) => {
  const { projectRepo } = useRepositories();

  return useQuery({
    queryKey: projectProductKeys.equipments(projectId),
    queryFn: async (): Promise<ProjectEquipmentAssignment[]> => {
      const useCase = new GetProjectEquipments(projectRepo);
      const result = await useCase.execute(projectId);
      if (!result.ok) throw new Error(result.error);
      return result.value;
    },
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
};

export const useAssignProjectEquipment = () => {
  const { projectRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, dto }: { projectId: string; dto: AssignEquipmentDTO }): Promise<ProjectEquipmentAssignment> => {
      const useCase = new AssignProjectEquipment(projectRepo);
      const result = await useCase.execute(projectId, dto);
      if (!result.ok) {
        if (result.error === 'DUPLICATE') throw new Error('DUPLICATE');
        throw new Error(result.error);
      }
      return result.value;
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectProductKeys.equipments(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
    onError: mapMutationError,
  });
};

export const useUpdateProjectEquipmentQty = () => {
  const { projectRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      equipmentId,
      dto,
    }: {
      projectId: string;
      equipmentId: string;
      dto: UpdateEquipmentQtyDTO;
    }): Promise<ProjectEquipmentAssignment> => {
      const useCase = new UpdateProjectEquipmentQty(projectRepo);
      const result = await useCase.execute(projectId, equipmentId, dto);
      if (!result.ok) throw new Error(result.error);
      return result.value;
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectProductKeys.equipments(projectId) });
    },
  });
};

export const useRemoveProjectEquipment = () => {
  const { projectRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, equipmentId }: { projectId: string; equipmentId: string }): Promise<void> => {
      const useCase = new RemoveProjectEquipment(projectRepo);
      const result = await useCase.execute(projectId, equipmentId);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectProductKeys.equipments(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
};

// ─── Spare Parts ──────────────────────────────────────────────────────────────

export const useProjectSpareParts = (projectId: string) => {
  const { projectRepo } = useRepositories();

  return useQuery({
    queryKey: projectProductKeys.spareParts(projectId),
    queryFn: async (): Promise<ProjectSparePartAssignment[]> => {
      const useCase = new GetProjectSpareParts(projectRepo);
      const result = await useCase.execute(projectId);
      if (!result.ok) throw new Error(result.error);
      return result.value;
    },
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
};

export const useAssignProjectSparePart = () => {
  const { projectRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, dto }: { projectId: string; dto: AssignSparePartDTO }): Promise<ProjectSparePartAssignment> => {
      const useCase = new AssignProjectSparePart(projectRepo);
      const result = await useCase.execute(projectId, dto);
      if (!result.ok) {
        if (result.error === 'DUPLICATE') throw new Error('DUPLICATE');
        throw new Error(result.error);
      }
      return result.value;
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectProductKeys.spareParts(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
    onError: mapMutationError,
  });
};

export const useUpdateProjectSparePartQty = () => {
  const { projectRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      sparePartId,
      dto,
    }: {
      projectId: string;
      sparePartId: string;
      dto: UpdateSparePartQtyDTO;
    }): Promise<ProjectSparePartAssignment> => {
      const useCase = new UpdateProjectSparePartQty(projectRepo);
      const result = await useCase.execute(projectId, sparePartId, dto);
      if (!result.ok) throw new Error(result.error);
      return result.value;
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectProductKeys.spareParts(projectId) });
    },
  });
};

export const useRemoveProjectSparePart = () => {
  const { projectRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, sparePartId }: { projectId: string; sparePartId: string }): Promise<void> => {
      const useCase = new RemoveProjectSparePart(projectRepo);
      const result = await useCase.execute(projectId, sparePartId);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectProductKeys.spareParts(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
};

// ─── Materials ────────────────────────────────────────────────────────────────

export const useProjectMaterials = (projectId: string) => {
  const { projectRepo } = useRepositories();

  return useQuery({
    queryKey: projectProductKeys.materials(projectId),
    queryFn: async (): Promise<ProjectMaterialAssignment[]> => {
      const useCase = new GetProjectMaterials(projectRepo);
      const result = await useCase.execute(projectId);
      if (!result.ok) throw new Error(result.error);
      return result.value;
    },
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
};

export const useAssignProjectMaterial = () => {
  const { projectRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, dto }: { projectId: string; dto: AssignMaterialDTO }): Promise<ProjectMaterialAssignment> => {
      const useCase = new AssignProjectMaterial(projectRepo);
      const result = await useCase.execute(projectId, dto);
      if (!result.ok) {
        if (result.error === 'DUPLICATE') throw new Error('DUPLICATE');
        throw new Error(result.error);
      }
      return result.value;
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectProductKeys.materials(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
    onError: mapMutationError,
  });
};

export const useUpdateProjectMaterialQty = () => {
  const { projectRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      materialId,
      dto,
    }: {
      projectId: string;
      materialId: string;
      dto: UpdateMaterialQtyDTO;
    }): Promise<ProjectMaterialAssignment> => {
      const useCase = new UpdateProjectMaterialQty(projectRepo);
      const result = await useCase.execute(projectId, materialId, dto);
      if (!result.ok) throw new Error(result.error);
      return result.value;
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectProductKeys.materials(projectId) });
    },
  });
};

export const useRemoveProjectMaterial = () => {
  const { projectRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, materialId }: { projectId: string; materialId: string }): Promise<void> => {
      const useCase = new RemoveProjectMaterial(projectRepo);
      const result = await useCase.execute(projectId, materialId);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectProductKeys.materials(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
};
