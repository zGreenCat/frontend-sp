import { IAreaRepository } from '@/domain/repositories/IAreaRepository';
import { Area } from '@/domain/entities/Area';
import { apiClient } from '@/infrastructure/api/apiClient';
import { CreateAreaDTO } from '@/application/usecases/area/CreateArea';

interface BackendArea {
  id: string;
  name: string;
  level: number;
  parentId?: string;
  parentAreaId?: string;
  status?: string;
  isActive?: boolean;
  tenantId?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  nodeType?: 'ROOT' | 'CHILD';
  children?: BackendArea[];
  parent?: {
    id: string;
    name: string;
    level: number;
  };
  // Campos de contadores (paginación)
  managersCount?: number;
  warehousesCount?: number;
  subAreasCount?: number;
  // Campos legacy de detalle
  warehouses?: Array<{id: string; name: string}>;
  managers?: Array<{id: string; name: string; email: string}>;
  warehouseCount?: number;
  managerCount?: number;
}

type BackendUpdateAreaPayload = {
  name?: string;
  parentAreaId?: string | null;
  isActive?: boolean;
};

type CreateAreaPayload = {
  name: string;
  nodeType: 'ROOT' | 'CHILD';
  parentAreaId: string | null;
};

export class ApiAreaRepository implements IAreaRepository {
  private mapBackendArea(backendArea: BackendArea): Area {
    // Determinar el status correcto: priorizar isActive sobre status
    let status: 'ACTIVO' | 'INACTIVO' = 'ACTIVO';
    if (typeof backendArea.isActive === 'boolean') {
      status = backendArea.isActive ? 'ACTIVO' : 'INACTIVO';
    } else if (backendArea.status) {
      status = backendArea.status as 'ACTIVO' | 'INACTIVO';
    }

    return {
      id: backendArea.id,
      name: backendArea.name,
      level: backendArea.level,
      parentId: backendArea.parentId || backendArea.parentAreaId,
      status: status,
      tenantId: backendArea.tenantId || '',
      nodeType: backendArea.nodeType,
      description: backendArea.description,
      children: (backendArea.children ?? []).map(child => this.mapBackendArea(child)),
      // Contadores del backend (paginación) - fuente única de verdad
      managersCount: backendArea.managersCount,
      warehousesCount: backendArea.warehousesCount,
      subAreasCount: backendArea.subAreasCount,
      parent: backendArea.parent,
    };
  }

  async findAll(tenantId: string): Promise<Area[]> {
    try {
      const response = await apiClient.get<any>('/areas', true);
      
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
      
      const mapped = backendAreas.map(a => this.mapBackendArea(a));
      return mapped;

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
     
      return area;
    } catch (error) {
      console.error('Error fetching area:', error);
      return null;
    }
  }
  
  // Método para obtener detalle completo de área con asignaciones
  async findByIdWithDetails(id: string): Promise<{
    area: Area;
    managers: Array<{ id: string; name: string; email: string; assignmentId?: string }>;
    warehouses: Array<{ id: string; name: string }>;
  } | null> {
    try {
      const response = await apiClient.get<any>(`/areas/${id}`, true);
      const backendArea = response.data || response;
      
      
      // Mapear managers con manejo seguro, incluyendo assignmentId y role
      const managers = (backendArea.managers || []).map((m: any) => ({
        id: m.id || m.userId || '',
        name: m.name ||  m.fullName || 'Sin nombre',
        email: m.email || '',
        role: m.role || '', // Rol del usuario (JEFE_AREA, SUPERVISOR, etc)
        assignmentId: m.assignmentId || '', // ID de la asignación para poder eliminarla
      }));
      
      // Mapear warehouses con manejo seguro
      const warehouses = (backendArea.warehouses || []).map((w: any) => ({
        id: w.id || w.warehouseId || '',
        name: w.name || 'Sin nombre',
      }));
      
      
      return {
        area: this.mapBackendArea(backendArea),
        managers,
        warehouses,
      };
    } catch (error) {
      console.error('Error fetching area with details:', error);
      return null;
    }
  }
async create(data: CreateAreaDTO): Promise<Area> {
  try {

    const payload = {
      name: data.name,
      nodeType: data.parentId ? "CHILD" : "ROOT",
      parentAreaId: data.parentId, // o null
    };

    const response = await apiClient.post<any, typeof payload>("/areas", payload, true);
    const backendArea = response.data || response;

    return this.mapBackendArea(backendArea);
  } catch (error) {
    console.error("Error creating area:", error);
    throw error;
  }
}


  async update(id: string, updates: Partial<Area>, tenantId: string): Promise<Area> {
    try {
      const payload: BackendUpdateAreaPayload = {};

      if (updates.name !== undefined) {
        payload.name = updates.name;
      }

      if (updates.parentId !== undefined) {
        payload.parentAreaId = updates.parentId ?? null;
      }

      if (updates.status !== undefined) {
        payload.isActive = updates.status === "ACTIVO";1
      }
      const response = await apiClient.put<any, BackendUpdateAreaPayload>(`/areas/${id}`, payload, true);
      
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
      await apiClient.post(`/areas/${areaId}/warehouses`, { warehouseId }, true);
      console.log(`✅ Warehouse assigned successfully`);
    } catch (error) {
      console.error('Error assigning warehouse:', error);
      throw error;
    }
  }

  async removeWarehouse(areaId: string, warehouseId: string): Promise<void> {
    try {
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
      await apiClient.post(`/areas/${areaId}/managers`, { managerId }, true);
      console.log(`✅ Manager assigned successfully`);
    } catch (error) {
      console.error('Error assigning manager:', error);
      throw error;
    }
  }

  async removeManager(areaId: string, managerId: string): Promise<void> {
    try {
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
