import { Project, ProjectStatus } from '../entities/Project';
import { Result } from '@/shared/types/Result';

// ─── Project Product Assignments ─────────────────────────────────────────────

export interface ProjectEquipmentAssignment {
  projectId: string;
  equipmentId: string;
  code?: string;
  name?: string;
  quantity: number;
  unitPrice?: number;
  subtotal?: number;
}

export interface ProjectSparePartAssignment {
  projectId: string;
  sparePartId: string;
  code?: string;
  name?: string;
  quantity: number;
  unitPrice?: number;
  subtotal?: number;
}

export interface ProjectMaterialAssignment {
  projectId: string;
  materialId: string;
  code?: string;
  name?: string;
  quantity: number; // decimal
  unitPrice?: number;
  subtotal?: number;
}

// ─── Assignment DTOs ──────────────────────────────────────────────────────────

export interface AssignEquipmentDTO {
  equipmentId: string;
  quantity: number; // integer
}

export interface UpdateEquipmentQtyDTO {
  quantity: number; // integer
}

export interface AssignSparePartDTO {
  sparePartId: string;
  quantity: number; // integer
}

export interface UpdateSparePartQtyDTO {
  quantity: number; // integer
}

export interface AssignMaterialDTO {
  materialId: string;
  quantity: number; // decimal
}

export interface UpdateMaterialQtyDTO {
  quantity: number; // decimal
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProjectQueryParams {
  page: number;
  limit?: number;
  search?: string;
  status?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProjectDTO {
  name: string;
  code: string;
}

export interface UpdateProjectDTO {
  name?: string;
  code?: string;
  status?: ProjectStatus;
  isActive?: boolean;
}

export interface ProductSummaryItem {
  id: string;
  code: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  subtotal?: number;
}

export interface CheckProductsResult {
  hasProducts: boolean;
  equipments: ProductSummaryItem[];
  spareParts: ProductSummaryItem[];
  materials: ProductSummaryItem[];
  totals: {
    equipments: number;
    spareParts: number;
    materials: number;
    total: number;
  };
}

export interface IProjectRepository {
  findAll(tenantId: string): Promise<Project[]>;
  getProjects(params: ProjectQueryParams): Promise<Result<PaginatedResponse<Project>>>;
  getProjectById(id: string): Promise<Result<Project>>;
  createProject(payload: CreateProjectDTO): Promise<Result<Project>>;
  updateProject(id: string, payload: UpdateProjectDTO): Promise<Result<Project>>;
  checkProjectProducts(id: string): Promise<Result<CheckProductsResult>>;

  // ─── Equipments ──────────────────────────────────────────────────────────
  getProjectEquipments(projectId: string): Promise<Result<ProjectEquipmentAssignment[]>>;
  assignEquipment(projectId: string, dto: AssignEquipmentDTO): Promise<Result<ProjectEquipmentAssignment>>;
  updateEquipmentQty(projectId: string, equipmentId: string, dto: UpdateEquipmentQtyDTO): Promise<Result<ProjectEquipmentAssignment>>;
  removeEquipment(projectId: string, equipmentId: string): Promise<Result<void>>;

  // ─── Spare Parts ─────────────────────────────────────────────────────────
  getProjectSpareParts(projectId: string): Promise<Result<ProjectSparePartAssignment[]>>;
  assignSparePart(projectId: string, dto: AssignSparePartDTO): Promise<Result<ProjectSparePartAssignment>>;
  updateSparePartQty(projectId: string, sparePartId: string, dto: UpdateSparePartQtyDTO): Promise<Result<ProjectSparePartAssignment>>;
  removeSparePart(projectId: string, sparePartId: string): Promise<Result<void>>;

  // ─── Materials ───────────────────────────────────────────────────────────
  getProjectMaterials(projectId: string): Promise<Result<ProjectMaterialAssignment[]>>;
  assignMaterial(projectId: string, dto: AssignMaterialDTO): Promise<Result<ProjectMaterialAssignment>>;
  updateMaterialQty(projectId: string, materialId: string, dto: UpdateMaterialQtyDTO): Promise<Result<ProjectMaterialAssignment>>;
  removeMaterial(projectId: string, materialId: string): Promise<Result<void>>;
}
