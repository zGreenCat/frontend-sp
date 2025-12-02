import { IWarehouseRepository } from '@/domain/repositories/IWarehouseRepository';
import { Warehouse } from '@/domain/entities/Warehouse';
import { apiClient } from '@/infrastructure/api/apiClient';

interface BackendWarehouse {
  id: string;
  name: string;
  capacityKg?: number;
  capacity?: number;
  isEnabled?: boolean;
  status?: string;
  areaId?: string;
  supervisorId?: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class ApiWarehouseRepository implements IWarehouseRepository {
  private mapBackendWarehouse(backendWarehouse: BackendWarehouse): Warehouse {
    // El backend puede usar isEnabled (boolean) o status (string)
    let status: 'ACTIVO' | 'INACTIVO' = 'ACTIVO';
    
    if (typeof backendWarehouse.isEnabled === 'boolean') {
      status = backendWarehouse.isEnabled ? 'ACTIVO' : 'INACTIVO';
    } else if (backendWarehouse.status) {
      status = backendWarehouse.status === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO';
    }
    
    return {
      id: backendWarehouse.id,
      name: backendWarehouse.name,
      capacityKg: backendWarehouse.capacityKg || backendWarehouse.capacity || 0,
      status,
      areaId: backendWarehouse.areaId,
      supervisorId: backendWarehouse.supervisorId,
      tenantId: backendWarehouse.tenantId || '',
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
      return backendWarehouses.map(w => this.mapBackendWarehouse(w));
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
      // TODO: Backend debe implementar POST /warehouses
      throw new Error('POST /warehouses not implemented in backend');
    } catch (error) {
      console.error('Error creating warehouse:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<Warehouse>, tenantId: string): Promise<Warehouse> {
    try {
      // TODO: Backend debe implementar PUT /warehouses/{id}
      throw new Error('PUT /warehouses/{id} not implemented in backend');
    } catch (error) {
      console.error('Error updating warehouse:', error);
      throw error;
    }
  }
}
