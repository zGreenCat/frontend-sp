import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';
import { Project } from '@/domain/entities/Project';
import { ProjectStatus } from '@/domain/entities/Project';
import {
  PaginatedResponse,
  ProjectQueryParams,
  CreateProjectDTO,
  UpdateProjectDTO,
  CheckProductsResult,
} from '@/domain/repositories/IProjectRepository';
import { GetProjects } from '@/application/usecases/project/GetProjects';
import { GetProjectById } from '@/application/usecases/project/GetProjectById';
import { CreateProject } from '@/application/usecases/project/CreateProject';
import { UpdateProject } from '@/application/usecases/project/UpdateProject';
import { CheckProjectProducts } from '@/application/usecases/project/CheckProjectProducts';
import { TENANT_ID } from '@/shared/constants';

// Query Keys con estabilidad
export const projectKeys = {
  all: ['projects', TENANT_ID] as const,
  list: (params: Partial<ProjectQueryParams>) => {
    // Normalizar params para queryKey estable (ordenar keys)
    const normalized: Record<string, any> = {};
    if (params.page !== undefined) normalized.page = params.page;
    if (params.limit !== undefined) normalized.limit = params.limit;
    if (params.search) normalized.search = params.search;
    if (params.status) normalized.status = params.status;
    if (params.isActive !== undefined) normalized.isActive = params.isActive;
    if (params.sortBy) normalized.sortBy = params.sortBy;
    if (params.sortOrder) normalized.sortOrder = params.sortOrder;

    // Opción más “blindada”: string estable
    // return ['projects', TENANT_ID, 'list', JSON.stringify(normalized)] as const;

    return ['projects', TENANT_ID, 'list', normalized] as const;
  },
  detail: (id: string) => ['projects', TENANT_ID, id] as const,
};

/**
 * Hook para obtener proyectos con filtros y paginación
 * Usa React Query con smooth pagination
 */
export const useProjects = (params: ProjectQueryParams) => {
  const { projectRepo } = useRepositories();

  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: async (): Promise<PaginatedResponse<Project>> => {
      const useCase = new GetProjects(projectRepo);
      const result = await useCase.execute(params);

      if (!result.ok) {
        throw new Error(result.error);
      }

      return result.value;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    placeholderData: keepPreviousData, // ✅ smooth pagination
  });
};

/**
 * Hook para obtener un proyecto por ID
 */
export const useProject = (id: string | undefined) => {
  const { projectRepo } = useRepositories();

  return useQuery({
    queryKey: projectKeys.detail(id || ''),
    queryFn: async (): Promise<Project> => {
      if (!id) throw new Error('Project ID is required');

      const useCase = new GetProjectById(projectRepo);
      const result = await useCase.execute(id);

      if (!result.ok) {
        throw new Error(result.error);
      }

      return result.value;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para crear un proyecto
 * Invalida caché de proyectos al completarse
 */
export const useCreateProject = () => {
  const { projectRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateProjectDTO): Promise<Project> => {
      const useCase = new CreateProject(projectRepo);
      const result = await useCase.execute(payload);

      if (!result.ok) {
        throw new Error(result.error);
      }

      return result.value;
    },
    onSuccess: () => {
      // ✅ invalida todo lo relacionado a projects (list + variantes)
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};

/**
 * Hook para actualizar un proyecto
 * Invalida caché de lista y detalle al completarse
 */
export const useUpdateProject = () => {
  const { projectRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateProjectDTO;
    }): Promise<Project> => {
      const useCase = new UpdateProject(projectRepo);
      const result = await useCase.execute(id, payload);

      if (!result.ok) {
        throw new Error(result.error);
      }

      return result.value;
    },
    onSuccess: (_data, variables) => {
      // ✅ invalida lista + detalle
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
    },
  });
};

/**
 * Hook (mutation) para verificar productos asignados antes de cambiar estado.
 * Se ejecuta on-demand (no es una query automática).
 */
export const useCheckProjectProducts = () => {
  const { projectRepo } = useRepositories();

  return useMutation({
    mutationFn: async (id: string): Promise<CheckProductsResult> => {
      const useCase = new CheckProjectProducts(projectRepo);
      const result = await useCase.execute(id);

      if (!result.ok) {
        throw new Error(result.error);
      }

      return result.value;
    },
  });
};

/**
 * Hook dedicado para cambio de estado de proyecto.
 * Invalida lista completa + detalle al completarse.
 */
export const useUpdateProjectStatus = () => {
  const { projectRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: ProjectStatus;
    }): Promise<Project> => {
      const useCase = new UpdateProject(projectRepo);
      const result = await useCase.execute(id, { status });

      if (!result.ok) {
        throw new Error(result.error);
      }

      return result.value;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
    },
  });
};