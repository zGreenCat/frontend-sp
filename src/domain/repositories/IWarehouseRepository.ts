import { Warehouse } from '../entities/Warehouse';
import { WarehouseSupervisor } from '../entities/WarehouseSupervisor';
import { Result } from '@/shared/types/Result';

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ListWarehousesParams {
  page: number;
  limit?: number;
  search?: string;
  isEnabled?: boolean;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface IWarehouseRepository {
  findAll(tenantId: string): Promise<Warehouse[]>;
  list(params: ListWarehousesParams): Promise<PaginatedResponse<Warehouse>>;
  findById(id: string, tenantId: string): Promise<Warehouse | null>;
  create(warehouse: Omit<Warehouse, 'id'>): Promise<Warehouse>;
  update(id: string, warehouse: Partial<Warehouse>, tenantId: string): Promise<Warehouse>;
  listWarehouseSupervisors(
    warehouseId: string,
    params: { page: number; limit: number }
  ): Promise<Result<PaginatedResponse<WarehouseSupervisor>>>;
}
