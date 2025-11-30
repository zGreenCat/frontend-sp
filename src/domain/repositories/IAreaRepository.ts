import { Area } from '../entities/Area';

export interface IAreaRepository {
  findAll(tenantId: string): Promise<Area[]>;
  findById(id: string, tenantId: string): Promise<Area | null>;
  create(area: Omit<Area, 'id'>): Promise<Area>;
  update(id: string, area: Partial<Area>, tenantId: string): Promise<Area>;
  
  // Asignación de bodegas
  assignWarehouse(areaId: string, warehouseId: string): Promise<void>;
  removeWarehouse(areaId: string, warehouseId: string): Promise<void>;
  getAssignedWarehouses(areaId: string): Promise<string[]>;
  
  // Asignación de jefes (managers)
  assignManager(areaId: string, managerId: string): Promise<void>;
  removeManager(areaId: string, managerId: string): Promise<void>;
  getAssignedManagers(areaId: string): Promise<string[]>;
}
