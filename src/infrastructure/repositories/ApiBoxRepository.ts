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

// Tipos del backend
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
  timestamp: string;
  userId: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
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
      eventType: event.eventType as 'CREATED' | 'UPDATED' | 'MOVED' | 'STATUS_CHANGED' | 'DEACTIVATED',
      timestamp: event.timestamp,
      userId: event.userId,
      description: event.description,
      metadata: event.metadata,
      createdAt: event.createdAt,
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
}
