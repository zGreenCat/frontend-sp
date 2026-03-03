import { 
  IProjectRepository, 
  PaginatedResponse, 
  ProjectQueryParams,
  CreateProjectDTO,
  UpdateProjectDTO,
  CheckProductsResult,
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
import { Project } from '@/domain/entities/Project';
import { Result, success, failure } from '@/shared/types/Result';
import { apiClient } from '@/infrastructure/api/apiClient';

interface BackendProject {
  id: string;
  name: string;
  code: string;
  status: string;
  isActive?: boolean;
  productsCount?: number;
  tenantId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface BackendPaginatedResponse {
  data: BackendProject[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  // Alternativa: respuesta sin meta
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export class ApiProjectRepository implements IProjectRepository {
  private mapBackendProject(backendProject: BackendProject): Project {
    return {
      id: backendProject.id,
      name: backendProject.name,
      code: backendProject.code,
      status: backendProject.status as any,
      isActive: backendProject.isActive,
      productsCount: backendProject.productsCount || 0,
      tenantId: backendProject.tenantId,
      createdAt: backendProject.createdAt,
      updatedAt: backendProject.updatedAt,
    };
  }

  async findAll(tenantId: string): Promise<Project[]> {
    try {
      const response = await apiClient.get<any>('/projects', true);
      console.log('📥 GET /projects response:', response);
      
      let backendProjects: BackendProject[];
      
      if (Array.isArray(response)) {
        backendProjects = response;
      } else if (response && Array.isArray(response.data)) {
        backendProjects = response.data;
      } else if (response && Array.isArray(response.projects)) {
        backendProjects = response.projects;
      } else {
        console.error('❌ Unexpected response structure from /projects:', response);
        return [];
      }
      
      return backendProjects.map(p => this.mapBackendProject(p));
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  async getProjects(params: ProjectQueryParams): Promise<Result<PaginatedResponse<Project>>> {
    try {
      const { page, limit, search, status, isActive, sortBy, sortOrder } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      if (limit !== undefined) queryParams.append('limit', limit.toString());
      if (search) queryParams.append('search', search);
      if (status) queryParams.append('status', status);
      // Solo enviar isActive si está definido
      if (isActive !== undefined) queryParams.append('isActive', isActive.toString());
      if (sortBy) queryParams.append('sortBy', sortBy);
      if (sortOrder) queryParams.append('sortOrder', sortOrder);

      const response = await apiClient.get<BackendPaginatedResponse>(`/projects?${queryParams.toString()}`, true);
      console.log('📥 GET /projects (filtered) response:', response);

      let data: BackendProject[] = [];
      let pagination = {
        page: params.page,
        limit: params.limit || 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };

      // Manejar diferentes estructuras de respuesta
      if (response.data && Array.isArray(response.data)) {
        data = response.data;
        
        // Caso 1: response.meta existe
        if (response.meta) {
          pagination = {
            page: response.meta.page,
            limit: response.meta.limit,
            total: response.meta.total,
            totalPages: response.meta.totalPages,
            hasNext: response.meta.page < response.meta.totalPages,
            hasPrev: response.meta.page > 1,
          };
        } 
        // Caso 2: campos en el root de response
        else {
          pagination = {
            page: response.page || params.page,
            limit: response.limit || params.limit || 10,
            total: response.total || data.length,
            totalPages: response.totalPages || Math.ceil((response.total || data.length) / (response.limit || params.limit || 10)),
            hasNext: response.page ? response.page < (response.totalPages || 1) : false,
            hasPrev: response.page ? response.page > 1 : false,
          };
        }
      } else if (Array.isArray(response)) {
        // Respuesta es array directo (sin paginación)
        data = response as unknown as BackendProject[];
        pagination.total = data.length;
        pagination.totalPages = Math.ceil(data.length / pagination.limit);
      }

      const projects = data.map(p => this.mapBackendProject(p));

      return success({
        data: projects,
        ...pagination,
      });
    } catch (error) {
      console.error('Error fetching filtered projects:', error);
      return failure('Error al obtener proyectos');
    }
  }

  async getProjectById(id: string): Promise<Result<Project>> {
    try {
      const response = await apiClient.get<any>(`/projects/${id}`, true);
      console.log(`📥 GET /projects/${id} response:`, response);
      
      const backendProject = response.data || response;
      const project = this.mapBackendProject(backendProject);
      
      return success(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      return failure('Error al obtener proyecto');
    }
  }

  async createProject(payload: CreateProjectDTO): Promise<Result<Project>> {
    try {
      // El backend solo acepta name y code
      const body = {
        name: payload.name,
        code: payload.code,
      };

      const response = await apiClient.post<any>('/projects', body, true);
      console.log('📥 POST /projects response:', response);

      const backendProject = response.data || response;
      const project = this.mapBackendProject(backendProject);
      
      return success(project);
    } catch (error) {
      console.error('Error creating project:', error);
      return failure('Error al crear proyecto');
    }
  }

  async updateProject(id: string, payload: UpdateProjectDTO): Promise<Result<Project>> {
    try {
      const body: any = {};
      
      if (payload.name !== undefined) body.name = payload.name;
      if (payload.code !== undefined) body.code = payload.code;
      if (payload.status !== undefined) body.status = payload.status;
      if (payload.isActive !== undefined) body.isActive = payload.isActive;

      const response = await apiClient.patch<any>(`/projects/${id}`, body, true);
      console.log(`📥 PATCH /projects/${id} response:`, response);

      const backendProject = response.data || response;
      const project = this.mapBackendProject(backendProject);
      
      return success(project);
    } catch (error) {
      console.error('Error updating project:', error);
      return failure('Error al actualizar proyecto');
    }
  }

  async checkProjectProducts(id: string): Promise<Result<CheckProductsResult>> {
    try {
      const response = await apiClient.get<any>(`/projects/${id}/check-products`, true);
      console.log(`📥 GET /projects/${id}/check-products response:`, response);

      const data = response.data || response;

      const result: CheckProductsResult = {
        hasProducts: data.hasProducts ?? false,
        equipments: data.equipments ?? [],
        spareParts: data.spareParts ?? [],
        materials: data.materials ?? [],
        totals: data.totals ?? {
          equipments: 0,
          spareParts: 0,
          materials: 0,
          total: 0,
        },
      };

      return success(result);
    } catch (error) {
      console.error('Error checking project products:', error);
      return failure('Error al verificar productos del proyecto');
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private mapEquipment(raw: any, projectId: string): ProjectEquipmentAssignment {
    return {
      projectId,
      equipmentId: raw.equipmentId ?? raw.id,
      code: raw.code ?? raw.equipment?.code,
      name: raw.name ?? raw.equipment?.name,
      quantity: Number(raw.quantity ?? 0),
      unitPrice: raw.unitPrice != null ? Number(raw.unitPrice) : undefined,
      subtotal: raw.subtotal != null ? Number(raw.subtotal) : undefined,
    };
  }

  private mapSparePart(raw: any, projectId: string): ProjectSparePartAssignment {
    return {
      projectId,
      sparePartId: raw.sparePartId ?? raw.id,
      code: raw.code ?? raw.sparePart?.code,
      name: raw.name ?? raw.sparePart?.name,
      quantity: Number(raw.quantity ?? 0),
      unitPrice: raw.unitPrice != null ? Number(raw.unitPrice) : undefined,
      subtotal: raw.subtotal != null ? Number(raw.subtotal) : undefined,
    };
  }

  private mapMaterial(raw: any, projectId: string): ProjectMaterialAssignment {
    return {
      projectId,
      materialId: raw.materialId ?? raw.id,
      code: raw.code ?? raw.material?.code,
      name: raw.name ?? raw.material?.name,
      quantity: Number(raw.quantity ?? 0),
      unitPrice: raw.unitPrice != null ? Number(raw.unitPrice) : undefined,
      subtotal: raw.subtotal != null ? Number(raw.subtotal) : undefined,
    };
  }

  private extractErrorMessage(error: any, fallback: string): string {
    if (error?.statusCode === 409) return 'DUPLICATE';
    return error?.message || fallback;
  }

  // ─── Equipments ─────────────────────────────────────────────────────────────

  async getProjectEquipments(projectId: string): Promise<Result<ProjectEquipmentAssignment[]>> {
    try {
      const response = await apiClient.get<any>(`/projects/${projectId}/equipments`, true);
      const data: any[] = response.data ?? response ?? [];
      return success(data.map(r => this.mapEquipment(r, projectId)));
    } catch (error) {
      return failure(this.extractErrorMessage(error, 'Error al obtener equipos del proyecto'));
    }
  }

  async assignEquipment(projectId: string, dto: AssignEquipmentDTO): Promise<Result<ProjectEquipmentAssignment>> {
    try {
      const body = { equipmentId: dto.equipmentId, quantity: Math.round(dto.quantity) };
      const response = await apiClient.post<any>(`/projects/${projectId}/equipments`, body, true);
      const raw = response.data ?? response;
      return success(this.mapEquipment(raw, projectId));
    } catch (error) {
      return failure(this.extractErrorMessage(error, 'Error al asignar equipo'));
    }
  }

  async updateEquipmentQty(projectId: string, equipmentId: string, dto: UpdateEquipmentQtyDTO): Promise<Result<ProjectEquipmentAssignment>> {
    try {
      const body = { quantity: Math.round(dto.quantity) };
      const response = await apiClient.patch<any>(`/projects/${projectId}/equipments/${equipmentId}`, body, true);
      const raw = response.data ?? response;
      return success(this.mapEquipment(raw, projectId));
    } catch (error) {
      return failure(this.extractErrorMessage(error, 'Error al actualizar cantidad'));
    }
  }

  async removeEquipment(projectId: string, equipmentId: string): Promise<Result<void>> {
    try {
      await apiClient.delete(`/projects/${projectId}/equipments/${equipmentId}`, true);
      return success(undefined);
    } catch (error) {
      return failure(this.extractErrorMessage(error, 'Error al eliminar equipo'));
    }
  }

  // ─── Spare Parts ─────────────────────────────────────────────────────────────

  async getProjectSpareParts(projectId: string): Promise<Result<ProjectSparePartAssignment[]>> {
    try {
      const response = await apiClient.get<any>(`/projects/${projectId}/spare-parts`, true);
      const data: any[] = response.data ?? response ?? [];
      return success(data.map(r => this.mapSparePart(r, projectId)));
    } catch (error) {
      return failure(this.extractErrorMessage(error, 'Error al obtener repuestos del proyecto'));
    }
  }

  async assignSparePart(projectId: string, dto: AssignSparePartDTO): Promise<Result<ProjectSparePartAssignment>> {
    try {
      const body = { sparePartId: dto.sparePartId, quantity: Math.round(dto.quantity) };
      const response = await apiClient.post<any>(`/projects/${projectId}/spare-parts`, body, true);
      const raw = response.data ?? response;
      return success(this.mapSparePart(raw, projectId));
    } catch (error) {
      return failure(this.extractErrorMessage(error, 'Error al asignar repuesto'));
    }
  }

  async updateSparePartQty(projectId: string, sparePartId: string, dto: UpdateSparePartQtyDTO): Promise<Result<ProjectSparePartAssignment>> {
    try {
      const body = { quantity: Math.round(dto.quantity) };
      const response = await apiClient.patch<any>(`/projects/${projectId}/spare-parts/${sparePartId}`, body, true);
      const raw = response.data ?? response;
      return success(this.mapSparePart(raw, projectId));
    } catch (error) {
      return failure(this.extractErrorMessage(error, 'Error al actualizar cantidad'));
    }
  }

  async removeSparePart(projectId: string, sparePartId: string): Promise<Result<void>> {
    try {
      await apiClient.delete(`/projects/${projectId}/spare-parts/${sparePartId}`, true);
      return success(undefined);
    } catch (error) {
      return failure(this.extractErrorMessage(error, 'Error al eliminar repuesto'));
    }
  }

  // ─── Materials ───────────────────────────────────────────────────────────────

  async getProjectMaterials(projectId: string): Promise<Result<ProjectMaterialAssignment[]>> {
    try {
      const response = await apiClient.get<any>(`/projects/${projectId}/materials`, true);
      const data: any[] = response.data ?? response ?? [];
      return success(data.map(r => this.mapMaterial(r, projectId)));
    } catch (error) {
      return failure(this.extractErrorMessage(error, 'Error al obtener materiales del proyecto'));
    }
  }

  async assignMaterial(projectId: string, dto: AssignMaterialDTO): Promise<Result<ProjectMaterialAssignment>> {
    try {
      const body = { materialId: dto.materialId, quantity: dto.quantity };
      const response = await apiClient.post<any>(`/projects/${projectId}/materials`, body, true);
      const raw = response.data ?? response;
      return success(this.mapMaterial(raw, projectId));
    } catch (error) {
      return failure(this.extractErrorMessage(error, 'Error al asignar material'));
    }
  }

  async updateMaterialQty(projectId: string, materialId: string, dto: UpdateMaterialQtyDTO): Promise<Result<ProjectMaterialAssignment>> {
    try {
      const body = { quantity: dto.quantity };
      const response = await apiClient.patch<any>(`/projects/${projectId}/materials/${materialId}`, body, true);
      const raw = response.data ?? response;
      return success(this.mapMaterial(raw, projectId));
    } catch (error) {
      return failure(this.extractErrorMessage(error, 'Error al actualizar cantidad'));
    }
  }

  async removeMaterial(projectId: string, materialId: string): Promise<Result<void>> {
    try {
      await apiClient.delete(`/projects/${projectId}/materials/${materialId}`, true);
      return success(undefined);
    } catch (error) {
      return failure(this.extractErrorMessage(error, 'Error al eliminar material'));
    }
  }
}
