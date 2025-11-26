import { IWarehouseRepository } from '@/domain/repositories/IWarehouseRepository';
import { Warehouse } from '@/domain/entities/Warehouse';
import { apiClient } from '@/infrastructure/api/apiClient';

interface BackendWarehouse {
  id: string;
  name: string;
  capacityKg: number;
  status: string;
  areaId?: string;
  supervisorId?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export class ApiWarehouseRepository implements IWarehouseRepository {
  private mapBackendWarehouse(backendWarehouse: BackendWarehouse): Warehouse {
    return {
      id: backendWarehouse.id,
      name: backendWarehouse.name,
      capacityKg: backendWarehouse.capacityKg,
      status: (backendWarehouse.status || 'ACTIVO') as 'ACTIVO' | 'INACTIVO',
      areaId: backendWarehouse.areaId,
      supervisorId: backendWarehouse.supervisorId,
      tenantId: backendWarehouse.tenantId,
    };
  }

  async findAll(tenantId: string): Promise<Warehouse[]> {
    try {
      // TODO: Backend debe implementar GET /warehouses
      // Por ahora retornamos array vacío
      console.warn('GET /warehouses not implemented in backend, returning empty array');
      return [];
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      return [];
    }
  }

  async findById(id: string, tenantId: string): Promise<Warehouse | null> {
    try {
      // TODO: Backend debe implementar GET /warehouses/{id}
      console.warn('GET /warehouses/{id} not implemented in backend');
      return null;
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
