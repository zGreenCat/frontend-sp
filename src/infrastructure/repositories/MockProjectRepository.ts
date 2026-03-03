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

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Proyecto Ampliación Planta Norte',
    code: 'PRJ-2025-001',
    status: 'ACTIVO',
    isActive: true,
    productsCount: 45,
    tenantId: 'kreatech-demo',
  },
  {
    id: '2',
    name: 'Proyecto Modernización Equipos',
    code: 'PRJ-2025-002',
    status: 'ACTIVO',
    isActive: true,
    productsCount: 23,
    tenantId: 'kreatech-demo',
  },
];

const projects = [...MOCK_PROJECTS];

export class MockProjectRepository implements IProjectRepository {
  async findAll(tenantId: string): Promise<Project[]> {
    await this.simulateLatency();
    return projects.filter(p => p.tenantId === tenantId);
  }

  async getProjects(params: ProjectQueryParams): Promise<Result<PaginatedResponse<Project>>> {
    await this.simulateLatency();
    
    let filtered = [...projects];
    
    // Filtrar por search
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.code.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtrar por status
    if (params.status) {
      filtered = filtered.filter(p => p.status === params.status);
    }
    
    // Filtrar por isActive
    if (params.isActive !== undefined) {
      filtered = filtered.filter(p => p.isActive === params.isActive);
    }
    
    // Ordenar
    if (params.sortBy) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[params.sortBy!];
        const bVal = (b as any)[params.sortBy!];
        const comparison = aVal > bVal ? 1 : -1;
        return params.sortOrder === 'desc' ? -comparison : comparison;
      });
    }
    
    // Paginar
    const limit = params.limit || 10;
    const start = (params.page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);
    
    return success({
      data: paginated,
      page: params.page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
      hasNext: params.page < Math.ceil(filtered.length / limit),
      hasPrev: params.page > 1,
    });
  }

  async getProjectById(id: string): Promise<Result<Project>> {
    await this.simulateLatency();
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      return failure('Proyecto no encontrado');
    }
    
    return success(project);
  }

  async createProject(payload: CreateProjectDTO): Promise<Result<Project>> {
    await this.simulateLatency();
    const newProject: Project = {
      id: Date.now().toString(),
      name: payload.name,
      code: payload.code,
      status: 'ACTIVO',
      isActive: true,
      productsCount: 0,
      tenantId: 'mock',
    };
    projects.push(newProject);
    return success(newProject);
  }

  async updateProject(id: string, payload: UpdateProjectDTO): Promise<Result<Project>> {
    await this.simulateLatency();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) {
      return failure('Proyecto no encontrado');
    }
      const updated: Project = {
      ...projects[index],
      ...(payload.name && { name: payload.name }),
      ...(payload.code && { code: payload.code }),
      ...(payload.status && { status: payload.status as any }),
      ...(payload.isActive !== undefined && { isActive: payload.isActive }),
    };
    
    projects[index] = updated;
    return success(updated);
  }

  private simulateLatency(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300));
  }

  async checkProjectProducts(id: string): Promise<Result<CheckProductsResult>> {
    await this.simulateLatency();
    return success({
      hasProducts: false,
      equipments: [],
      spareParts: [],
      materials: [],
      totals: { equipments: 0, spareParts: 0, materials: 0, total: 0 },
    });
  }

  // ─── Equipments ─────────────────────────────────────────────────────────────

  async getProjectEquipments(_projectId: string): Promise<Result<ProjectEquipmentAssignment[]>> {
    await this.simulateLatency();
    return success([]);
  }

  async assignEquipment(projectId: string, dto: AssignEquipmentDTO): Promise<Result<ProjectEquipmentAssignment>> {
    await this.simulateLatency();
    return success({ projectId, equipmentId: dto.equipmentId, quantity: dto.quantity });
  }

  async updateEquipmentQty(projectId: string, equipmentId: string, dto: UpdateEquipmentQtyDTO): Promise<Result<ProjectEquipmentAssignment>> {
    await this.simulateLatency();
    return success({ projectId, equipmentId, quantity: dto.quantity });
  }

  async removeEquipment(_projectId: string, _equipmentId: string): Promise<Result<void>> {
    await this.simulateLatency();
    return success(undefined);
  }

  // ─── Spare Parts ─────────────────────────────────────────────────────────────

  async getProjectSpareParts(_projectId: string): Promise<Result<ProjectSparePartAssignment[]>> {
    await this.simulateLatency();
    return success([]);
  }

  async assignSparePart(projectId: string, dto: AssignSparePartDTO): Promise<Result<ProjectSparePartAssignment>> {
    await this.simulateLatency();
    return success({ projectId, sparePartId: dto.sparePartId, quantity: dto.quantity });
  }

  async updateSparePartQty(projectId: string, sparePartId: string, dto: UpdateSparePartQtyDTO): Promise<Result<ProjectSparePartAssignment>> {
    await this.simulateLatency();
    return success({ projectId, sparePartId, quantity: dto.quantity });
  }

  async removeSparePart(_projectId: string, _sparePartId: string): Promise<Result<void>> {
    await this.simulateLatency();
    return success(undefined);
  }

  // ─── Materials ───────────────────────────────────────────────────────────────

  async getProjectMaterials(_projectId: string): Promise<Result<ProjectMaterialAssignment[]>> {
    await this.simulateLatency();
    return success([]);
  }

  async assignMaterial(projectId: string, dto: AssignMaterialDTO): Promise<Result<ProjectMaterialAssignment>> {
    await this.simulateLatency();
    return success({ projectId, materialId: dto.materialId, quantity: dto.quantity });
  }

  async updateMaterialQty(projectId: string, materialId: string, dto: UpdateMaterialQtyDTO): Promise<Result<ProjectMaterialAssignment>> {
    await this.simulateLatency();
    return success({ projectId, materialId, quantity: dto.quantity });
  }

  async removeMaterial(_projectId: string, _materialId: string): Promise<Result<void>> {
    await this.simulateLatency();
    return success(undefined);
  }
}
