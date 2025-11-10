import { Area } from '../entities/Area';

export interface IAreaRepository {
  findAll(tenantId: string): Promise<Area[]>;
  findById(id: string, tenantId: string): Promise<Area | null>;
  create(area: Omit<Area, 'id'>): Promise<Area>;
  update(id: string, area: Partial<Area>, tenantId: string): Promise<Area>;
}
