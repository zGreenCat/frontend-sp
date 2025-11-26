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
      return this.mapBackendArea(backendArea);
    } catch (error) {
      console.error('Error fetching area:', error);
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
}
