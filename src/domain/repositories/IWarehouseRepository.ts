import { Warehouse } from '../entities/Warehouse';

export interface IWarehouseRepository {
  findAll(tenantId: string): Promise<Warehouse[]>;
  findById(id: string, tenantId: string): Promise<Warehouse | null>;
  create(warehouse: Omit<Warehouse, 'id'>): Promise<Warehouse>;
  update(id: string, warehouse: Partial<Warehouse>, tenantId: string): Promise<Warehouse>;
}
