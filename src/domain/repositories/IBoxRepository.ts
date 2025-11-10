import { Box } from '../entities/Box';

export interface IBoxRepository {
  findAll(tenantId: string): Promise<Box[]>;
  findById(id: string, tenantId: string): Promise<Box | null>;
  create(box: Omit<Box, 'id'>): Promise<Box>;
  update(id: string, box: Partial<Box>, tenantId: string): Promise<Box>;
}
