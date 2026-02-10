import { apiClient } from '@/infrastructure/api/apiClient';
import { 
  IBoxRepository, 
  BoxListFilters, 
  BoxListResponse, 
  HistoryFilters, 
  HistoryResponse,
  CreateBoxDTO,
  UpdateBoxDTO,
  MoveBoxDTO,
  ChangeStatusDTO
} from '@/domain/repositories/IBoxRepository';
import { Box, HistoryEvent } from '@/domain/entities/Box';
import { BoxEquipment, BoxEquipmentSparePart } from '@/domain/entities/BoxEquipment';
import { BoxMaterial } from '@/domain/entities/BoxMaterial';

// Tipos del backend
interface BackendBoxEquipmentSparePart {
  id: string;
  boxEquipmentId: string;
  quantity: number;
  assignedAt: string;
  revokedAt: string | null;
  sparePart: any; // Estructura completa del spare part
}

interface BackendBoxEquipment {
  id: string;
  boxId: string;
  quantity: number;
  assignedAt: string;
  revokedAt: string | null;
  equipment: any; // Estructura completa del equipment
  spareParts?: BackendBoxEquipmentSparePart[];
}

interface BackendBoxMaterial {
  id: string;
  boxId: string;
  quantity: number;
  assignedAt: string;
  revokedAt: string | null;
  material: any; // Estructura completa del material
}

interface BackendBox {
  id: string;
  qrCode: string;
  description?: string;
  type: string;
  currentWeightKg: number;
  status: string;
  warehouseId: string | null;
  warehouseName?: string | null; // Nombre de la bodega
  warehouse?: {
    id: string;
    name: string;
    capacityKg: number;
  };
  equipments?: BackendBoxEquipment[];
  materials?: BackendBoxMaterial[];
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  history?: BackendHistoryEvent[];
}

interface BackendHistoryEvent {
  id: string;
  boxId: string;
  eventType: string;
  reason?: string;
  performedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  occurredAt: string;
}

interface BackendBoxListResponse {
  data: BackendBox[];
  total: number;
  page: number;
  limit: number;
}

interface BackendHistoryResponse {
  data: BackendHistoryEvent[];
  total: number;
  page: number;
  limit: number;
}

export class ApiBoxRepository implements IBoxRepository {
  // Mapear BoxEquipmentSparePart del backend al dominio
  private mapBackendSparePart(backendSparePart: BackendBoxEquipmentSparePart): BoxEquipmentSparePart {
    return {
      id: backendSparePart.id,
      boxEquipmentId: backendSparePart.boxEquipmentId,
      quantity: backendSparePart.quantity,
      assignedAt: backendSparePart.assignedAt,
      revokedAt: backendSparePart.revokedAt,
      sparePart: {
        id: backendSparePart.sparePart.id,
        name: backendSparePart.sparePart.name,
        description: backendSparePart.sparePart.description,
        category: backendSparePart.sparePart.category,
        equipmentId: backendSparePart.sparePart.equipmentId,
        dimensions: backendSparePart.sparePart.dimensions,
        price: backendSparePart.sparePart.price,
        status: backendSparePart.sparePart.status,
        audit: backendSparePart.sparePart.audit,
      },
    };
  }

  // Mapear BoxEquipment del backend al dominio
  private mapBackendEquipment(backendEquipment: BackendBoxEquipment): BoxEquipment {
    // Si no viene el objeto equipment completo, crear uno básico
    if (!backendEquipment.equipment) {
      console.warn('[ApiBoxRepository] Equipment object not found in response, creating minimal structure');
      return {
        id: backendEquipment.id,
        boxId: backendEquipment.boxId,
        quantity: backendEquipment.quantity,
        assignedAt: backendEquipment.assignedAt,
        revokedAt: backendEquipment.revokedAt,
        equipment: {
          id: (backendEquipment as any).equipmentId || '',
          name: 'Equipo',
          description: '',
          status: {
            isActive: true,
          },
          audit: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        spareParts: [],
      };
    }
    
    return {
      id: backendEquipment.id,
      boxId: backendEquipment.boxId,
      quantity: backendEquipment.quantity,
      assignedAt: backendEquipment.assignedAt,
      revokedAt: backendEquipment.revokedAt,
      equipment: {
        id: backendEquipment.equipment.id,
        name: backendEquipment.equipment.name,
        model: backendEquipment.equipment.model,
        description: backendEquipment.equipment.description,
        dimensions: backendEquipment.equipment.dimensions,
        price: backendEquipment.equipment.price,
        status: backendEquipment.equipment.status,
        audit: backendEquipment.equipment.audit,
      },
      spareParts: backendEquipment.spareParts?.map(sp => this.mapBackendSparePart(sp)),
    };
  }

  // Mapear BoxMaterial del backend al dominio
  private mapBackendMaterial(backendMaterial: BackendBoxMaterial): BoxMaterial {
    // Si no viene el objeto material completo, crear uno básico
    if (!backendMaterial.material) {
      console.warn('[ApiBoxRepository] Material object not found in response, creating minimal structure');
      return {
        id: backendMaterial.id,
        boxId: backendMaterial.boxId,
        quantity: backendMaterial.quantity,
        assignedAt: backendMaterial.assignedAt,
        revokedAt: backendMaterial.revokedAt,
        material: {
          id: (backendMaterial as any).materialId || '',
          name: 'Material',
          description: '',
          flags: {
            isHazardous: false,
            isActive: true,
          },
          audit: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }
    
    return {
      id: backendMaterial.id,
      boxId: backendMaterial.boxId,
      quantity: backendMaterial.quantity,
      assignedAt: backendMaterial.assignedAt,
      revokedAt: backendMaterial.revokedAt,
      material: {
        id: backendMaterial.material.id,
        name: backendMaterial.material.name,
        description: backendMaterial.material.description,
        price: backendMaterial.material.price,
        unitOfMeasure: backendMaterial.material.unitOfMeasure,
        categories: backendMaterial.material.categories,
        flags: backendMaterial.material.flags,
        audit: backendMaterial.material.audit,
      },
    };
  }

  // Mapear Box del backend al dominio
  private mapBackendBox(backendBox: BackendBox): Box {
    return {
      id: backendBox.id,
      qrCode: backendBox.qrCode,
      description: backendBox.description,
      type: backendBox.type as 'PEQUEÑA' | 'NORMAL' | 'GRANDE',
      currentWeightKg: backendBox.currentWeightKg,
      status: backendBox.status as 'DISPONIBLE' | 'EN_REPARACION' | 'DANADA' | 'RETIRADA',
      warehouseId: backendBox.warehouseId,
      warehouseName: backendBox.warehouseName ?? null, // ✅ Agregar campo del backend
      warehouse: backendBox.warehouse ? {
        id: backendBox.warehouse.id,
        name: backendBox.warehouse.name,
        capacityKg: backendBox.warehouse.capacityKg,
      } : undefined,
      equipments: backendBox.equipments?.map(eq => this.mapBackendEquipment(eq)),
      materials: backendBox.materials?.map(mat => this.mapBackendMaterial(mat)),
      history: backendBox.history?.map(this.mapBackendHistoryEvent),
      tenantId: backendBox.tenantId,
      isActive: backendBox.isActive,
      createdAt: backendBox.createdAt,
      updatedAt: backendBox.updatedAt,
    };
  }

  // Mapear HistoryEvent del backend al dominio
  private mapBackendHistoryEvent(event: BackendHistoryEvent): HistoryEvent {
    return {
      id: event.id,
      boxId: event.boxId,
      eventType: event.eventType as any,
      reason: event.reason,
      performedBy: event.performedBy,
      occurredAt: event.occurredAt,
    };
  }

  async findAll(tenantId: string, filters?: BoxListFilters): Promise<BoxListResponse> {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId); // ✅ Filtro por bodega

    const response = await apiClient.get<BackendBoxListResponse>(
      `/boxes?${params.toString()}`,
      true // ✅ Auth: Requiere Bearer token
    );

    return {
      data: response.data.map(box => this.mapBackendBox(box)),
      total: response.total,
      page: response.page,
      limit: response.limit,
    };
  }

  async findById(id: string, tenantId: string): Promise<Box | null> {
    try {
      const response = await apiClient.get<BackendBox>(`/boxes/${id}`, true); // ✅ Auth: Requiere Bearer token
      return this.mapBackendBox(response);
    } catch (error: any) {
      if (error?.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async findByQrCode(qrCode: string, tenantId: string): Promise<Box | null> {
    try {
      const response = await apiClient.get<BackendBox>(`/boxes/qr/${qrCode}`, true); // ✅ Auth: Requiere Bearer token
      return this.mapBackendBox(response);
    } catch (error: any) {
      if (error?.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(data: CreateBoxDTO, tenantId: string): Promise<Box> {
    const response = await apiClient.post<BackendBox>('/boxes', data, true); // ✅ Auth: Requiere Bearer token
    return this.mapBackendBox(response);
  }

  async update(id: string, data: UpdateBoxDTO, tenantId: string): Promise<Box> {
    const response = await apiClient.patch<BackendBox>(`/boxes/${id}`, data, true); // ✅ Auth: Requiere Bearer token
    return this.mapBackendBox(response);
  }

  async move(id: string, data: MoveBoxDTO, tenantId: string): Promise<Box> {
    const response = await apiClient.patch<BackendBox>(`/boxes/${id}/move`, data, true); // ✅ Auth: Requiere Bearer token
    return this.mapBackendBox(response);
  }

  async changeStatus(id: string, data: ChangeStatusDTO, tenantId: string): Promise<Box> {
    const response = await apiClient.patch<BackendBox>(`/boxes/${id}/status`, data, true); // ✅ Auth: Requiere Bearer token
    return this.mapBackendBox(response);
  }

  async deactivate(id: string, tenantId: string): Promise<Box> {
    const response = await apiClient.patch<BackendBox>(`/boxes/${id}/deactivate`, {}, true); // ✅ Auth: Requiere Bearer token
    return this.mapBackendBox(response);
  }

  async getHistory(id: string, tenantId: string, filters?: HistoryFilters): Promise<HistoryResponse> {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.eventType) params.append('eventType', filters.eventType);

    const response = await apiClient.get<BackendHistoryResponse>(
      `/boxes/${id}/history?${params.toString()}`,
      true // ✅ Auth: Requiere Bearer token
    );

    return {
      data: response.data.map(event => this.mapBackendHistoryEvent(event)),
      total: response.total,
      page: response.page,
      limit: response.limit,
    };
  }

  // ========== MÉTODOS DE INVENTARIO ==========

  async addEquipment(
    boxId: string,
    input: { equipmentId: string; quantity: number; reason?: string },
    tenantId: string
  ): Promise<BoxEquipment> {
    const response = await apiClient.post<any>(
      `/boxes/${boxId}/equipments`,
      input,
      true // ✅ Auth: Requiere Bearer token
    );
    // Manejar posibles estructuras de respuesta
    const backendEquipment = response.data || response;
    return this.mapBackendEquipment(backendEquipment);
  }

  async addMaterial(
    boxId: string,
    input: { materialId: string; quantity: number; reason?: string },
    tenantId: string
  ): Promise<BoxMaterial> {
    const response = await apiClient.post<any>(
      `/boxes/${boxId}/materials`,
      input,
      true // ✅ Auth: Requiere Bearer token
    );
    // Manejar posibles estructuras de respuesta
    const backendMaterial = response.data || response;
    return this.mapBackendMaterial(backendMaterial);
  }

  async removeEquipment(
    boxId: string,
    assignmentId: string,
    tenantId: string,
    reason?: string
  ): Promise<void> {
    const endpoint = reason 
      ? `/boxes/${boxId}/equipments/${assignmentId}?reason=${encodeURIComponent(reason)}`
      : `/boxes/${boxId}/equipments/${assignmentId}`;
    
    await apiClient.delete<void>(endpoint, true);
  }

  async removeMaterial(
    boxId: string,
    assignmentId: string,
    tenantId: string,
    reason?: string
  ): Promise<void> {
    const endpoint = reason 
      ? `/boxes/${boxId}/materials/${assignmentId}?reason=${encodeURIComponent(reason)}`
      : `/boxes/${boxId}/materials/${assignmentId}`;
    
    await apiClient.delete<void>(endpoint, true);
  }
}
