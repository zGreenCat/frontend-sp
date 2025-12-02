import { IAreaRepository } from '@/domain/repositories/IAreaRepository';
import { Area } from '@/domain/entities/Area';
import { apiClient } from '@/infrastructure/api/apiClient';

interface BackendArea {
  id: string;
  name: string;
  level: number;
  parentId?: string;
  status: string;
  tenantId: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export class ApiAreaRepository implements IAreaRepository {
  private mapBackendArea(backendArea: BackendArea): Area {
    return {
      id: backendArea.id,
      name: backendArea.name,
      level: backendArea.level || 1,
      parentId: backendArea.parentId,
      status: (backendArea.status || 'ACTIVO') as 'ACTIVO' | 'INACTIVO',
      tenantId: backendArea.tenantId,
    };
  }

  async findAll(tenantId: string): Promise<Area[]> {
    try {
      const response = await apiClient.get<any>('/areas', true);
      console.log('📥 GET /areas response:', response);
      
      // El backend puede devolver array directo o { data: [...] }
      let backendAreas: BackendArea[];
      
      if (Array.isArray(response)) {
        backendAreas = response;
      } else if (response && Array.isArray(response.data)) {
        backendAreas = response.data;
      } else if (response && Array.isArray(response.areas)) {
        backendAreas = response.areas;
      } else {
        console.error('❌ Unexpected response structure from /areas:', response);
        return [];
      }
      
      console.log('✅ Extracted', backendAreas.length, 'areas');
      return backendAreas.map(a => this.mapBackendArea(a));
    } catch (error) {
      console.error('Error fetching areas:', error);
      return [];
    }
  }

  async findById(id: string, tenantId: string): Promise<Area | null> {
    try {
      const response = await apiClient.get<any>(`/areas/${id}`, true);
      
      // Manejar posibles estructuras de respuesta
      const backendArea = response.data || response;
      
      // El endpoint GET /areas/:id devuelve información completa con managers y warehouses
      const area = this.mapBackendArea(backendArea);
      
      // Agregar información adicional si está disponible en la respuesta
      if (backendArea.managers) {
        console.log('📋 Area has managers:', backendArea.managers);
      }
      if (backendArea.warehouses) {
        console.log('📦 Area has warehouses:', backendArea.warehouses);
      }
      
      return area;
    } catch (error) {
      console.error('Error fetching area:', error);
      return null;
    }
  }
  
  // Método para obtener detalle completo de área con asignaciones
  async findByIdWithDetails(id: string): Promise<{
    area: Area;
    managers: Array<{ id: string; name: string; email: string }>;
    warehouses: Array<{ id: string; name: string }>;
  } | null> {
    try {
      const response = await apiClient.get<any>(`/areas/${id}`, true);
      const backendArea = response.data || response;
      
      return {
        area: this.mapBackendArea(backendArea),
        managers: backendArea.managers || [],
        warehouses: backendArea.warehouses || [],
      };
    } catch (error) {
      console.error('Error fetching area with details:', error);
      return null;
    }
  }

  async create(area: Omit<Area, 'id'>): Promise<Area> {
    try {
      console.log('📤 Creating area with data:', area);
      const response = await apiClient.post<any, Omit<Area, 'id'>>('/areas', area, true);
      console.log('📥 Create area response:', response);
      
      // Manejar posibles estructuras de respuesta
      const backendArea = response.data || response;
      return this.mapBackendArea(backendArea);
    } catch (error) {
      console.error('Error creating area:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<Area>, tenantId: string): Promise<Area> {
    try {
      console.log('📤 Updating area', id, 'with data:', updates);
      const response = await apiClient.put<any, Partial<Area>>(`/areas/${id}`, updates, true);
      console.log('📥 Update area response:', response);
      
      // Manejar posibles estructuras de respuesta
      const backendArea = response.data || response;
      return this.mapBackendArea(backendArea);
    } catch (error) {
      console.error('Error updating area:', error);
      throw error;
    }
  }

  // ────────────────────────────────────────────────────────────────
  // ASIGNACIÓN DE BODEGAS
  // ────────────────────────────────────────────────────────────────

  async assignWarehouse(areaId: string, warehouseId: string): Promise<void> {
    try {
      console.log(`📤 Assigning warehouse ${warehouseId} to area ${areaId}`);
      await apiClient.post(`/areas/${areaId}/warehouses`, { warehouseId }, true);
      console.log(`✅ Warehouse assigned successfully`);
    } catch (error) {
      console.error('Error assigning warehouse:', error);
      throw error;
    }
  }

  async removeWarehouse(areaId: string, warehouseId: string): Promise<void> {
    try {
      console.log(`📤 Removing warehouse ${warehouseId} from area ${areaId}`);
      await apiClient.delete(`/areas/${areaId}/warehouses/${warehouseId}`, true);
      console.log(`✅ Warehouse removed successfully`);
    } catch (error) {
      console.error('Error removing warehouse:', error);
      throw error;
    }
  }

  async getAssignedWarehouses(areaId: string): Promise<string[]> {
    try {
      const response = await apiClient.get<any>(`/areas/${areaId}/warehouses`, true);
      
      // El backend puede devolver array directo o { data: [...] }
      let warehouses: any[];
      if (Array.isArray(response)) {
        warehouses = response;
      } else if (response && Array.isArray(response.data)) {
        warehouses = response.data;
      } else if (response && Array.isArray(response.warehouses)) {
        warehouses = response.warehouses;
      } else {
        return [];
      }
      
      // Extraer solo los IDs
      return warehouses.map(w => w.id || w.warehouseId || w);
    } catch (error) {
      console.error('Error fetching assigned warehouses:', error);
      return [];
    }
  }

  // ────────────────────────────────────────────────────────────────
  // ASIGNACIÓN DE JEFES (MANAGERS)
  // ────────────────────────────────────────────────────────────────

  async assignManager(areaId: string, managerId: string): Promise<void> {
    try {
      console.log(`📤 Assigning manager ${managerId} to area ${areaId}`);
      await apiClient.post(`/areas/${areaId}/managers`, { managerId }, true);
      console.log(`✅ Manager assigned successfully`);
    } catch (error) {
      console.error('Error assigning manager:', error);
      throw error;
    }
  }

  async removeManager(areaId: string, managerId: string): Promise<void> {
    try {
      console.log(`📤 Removing manager ${managerId} from area ${areaId}`);
      await apiClient.delete(`/areas/${areaId}/managers/${managerId}`, true);
      console.log(`✅ Manager removed successfully`);
    } catch (error) {
      console.error('Error removing manager:', error);
      throw error;
    }
  }

  async getAssignedManagers(areaId: string): Promise<string[]> {
    try {
      const response = await apiClient.get<any>(`/areas/${areaId}/managers`, true);
      
      // El backend puede devolver array directo o { data: [...] }
      let managers: any[];
      if (Array.isArray(response)) {
        managers = response;
      } else if (response && Array.isArray(response.data)) {
        managers = response.data;
      } else if (response && Array.isArray(response.managers)) {
        managers = response.managers;
      } else {
        return [];
      }
      
      // Extraer solo los IDs
      return managers.map(m => m.id || m.userId || m.managerId || m);
    } catch (error) {
      console.error('Error fetching assigned managers:', error);
      return [];
    }
  }
}
