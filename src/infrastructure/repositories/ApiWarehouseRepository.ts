import { IWarehouseRepository, PaginatedResponse } from '@/domain/repositories/IWarehouseRepository';
import { Warehouse } from '@/domain/entities/Warehouse';
import { WarehouseSupervisor } from '@/domain/entities/WarehouseSupervisor';
import { Result, success, failure } from '@/shared/types/Result';
import { apiClient } from '@/infrastructure/api/apiClient';

interface BackendWarehouse {
  id: string;
  name: string;
  maxCapacityKg?: number;
  capacityKg?: number; // deprecated, por compatibilidad
  capacity?: number; // deprecated, por compatibilidad
  isEnabled?: boolean;
  status?: string; // deprecated, por compatibilidad
  areaId?: string;
  supervisorId?: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
  currentCapacityKg?: number;
  area?: {
    idArea: string;
    nameArea: string;
  };
}

export class ApiWarehouseRepository implements IWarehouseRepository {
  private mapBackendWarehouse(backendWarehouse: BackendWarehouse): Warehouse {
    // Mapear isEnabled del backend
    const isEnabled = backendWarehouse.isEnabled ?? true;
    
    // Mapear maxCapacityKg del backend (con fallbacks por compatibilidad)
    const maxCapacityKg = backendWarehouse.maxCapacityKg 
      || backendWarehouse.capacityKg 
      || backendWarehouse.capacity 
      || 900;
    
    // ✅ Extraer areaId y areaName desde area anidada
    const areaId = backendWarehouse.area?.idArea || backendWarehouse.areaId;
    const areaName = backendWarehouse.area?.nameArea;
    
    return {
      id: backendWarehouse.id,
      name: backendWarehouse.name,
      maxCapacityKg,
      isEnabled,
      areaId,
      areaName, // ✅ Incluir nombre del área
      supervisorId: backendWarehouse.supervisorId,
      tenantId: backendWarehouse.tenantId,
      currentCapacityKg: backendWarehouse.currentCapacityKg,
      createdAt: backendWarehouse.createdAt,
      updatedAt: backendWarehouse.updatedAt,
      // Computed property para retrocompatibilidad
      get status() {
        return this.isEnabled ? 'ACTIVO' : 'INACTIVO';
      },
      capacityKg: maxCapacityKg, // deprecated alias
    };
  }

  async findAll(tenantId: string): Promise<Warehouse[]> {
    try {
      const response = await apiClient.get<any>('/warehouses', true);
      console.log('📥 GET /warehouses response:', response);
      
      // El backend puede devolver array directo o { data: [...] }
      let backendWarehouses: BackendWarehouse[];
      
      if (Array.isArray(response)) {
        backendWarehouses = response;
      } else if (response && Array.isArray(response.data)) {
        backendWarehouses = response.data;
      } else if (response && Array.isArray(response.warehouses)) {
        backendWarehouses = response.warehouses;
      } else {
        console.error('❌ Unexpected response structure from /warehouses:', response);
        return [];
      }
      
      console.log('✅ Extracted', backendWarehouses.length, 'warehouses');
      console.log('🔍 First warehouse from backend:', backendWarehouses[0]);
      
      const mapped = backendWarehouses.map(w => this.mapBackendWarehouse(w));
      console.log('🔍 First warehouse after mapping:', mapped[0]);
      
      return mapped;
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      return [];
    }
  }

  async findById(id: string, tenantId: string): Promise<Warehouse | null> {
    try {
      const response = await apiClient.get<any>(`/warehouses/${id}`, true);
      
      // Manejar posibles estructuras de respuesta
      const backendWarehouse = response.data || response;
      return this.mapBackendWarehouse(backendWarehouse);
    } catch (error) {
      console.error('Error fetching warehouse:', error);
      return null;
    }
  }

  async create(warehouse: Omit<Warehouse, 'id'>): Promise<Warehouse> {
    try {
      const response = await apiClient.post<any>('/warehouses', {
        name: warehouse.name,
        maxCapacityKg: warehouse.maxCapacityKg,
        isEnabled: warehouse.isEnabled ?? true,
      }, true);

      const backendWarehouse = response.data || response;
      return this.mapBackendWarehouse(backendWarehouse);
    } catch (error) {
      console.error('Error creating warehouse:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<Warehouse>, tenantId: string): Promise<Warehouse> {
    try {
      const payload: any = {};
      
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.maxCapacityKg !== undefined) payload.maxCapacityKg = updates.maxCapacityKg;
      if (updates.isEnabled !== undefined) payload.isEnabled = updates.isEnabled;

      const response = await apiClient.patch<any>(`/warehouses/${id}`, payload, true);

      const backendWarehouse = response.data || response;
      return this.mapBackendWarehouse(backendWarehouse);
    } catch (error) {
      console.error('Error updating warehouse:', error);
      throw error;
    }
  }

  /**
   * Lista los supervisores asignados a una bodega
   * GET /warehouses/{warehouseId}/supervisors?page=1&limit=10
   */
  async listWarehouseSupervisors(
    warehouseId: string,
    params: { page: number; limit: number }
  ): Promise<Result<PaginatedResponse<WarehouseSupervisor>>> {
    try {
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
      }).toString();
      
      const response = await apiClient.get<any>(
        `/warehouses/${warehouseId}/supervisors?${queryParams}`,
        true
      );

      // Estructura esperada del backend:
      // {
      //   data: [...],
      //   page, limit, totalPages, total, hasNext, hasPrev
      // }
      
      const paginatedData: PaginatedResponse<WarehouseSupervisor> = {
        data: response.data || [],
        page: response.page || params.page,
        limit: response.limit || params.limit,
        totalPages: response.totalPages || 0,
        total: response.total || 0,
        hasNext: response.hasNext || false,
        hasPrev: response.hasPrev || false,
      };

      return success(paginatedData);
    } catch (error: any) {
      console.error('Error fetching warehouse supervisors:', error);
      return failure(error?.message || 'Error al obtener supervisores de la bodega');
    }
  }
}
