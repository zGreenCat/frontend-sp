import { User } from '../entities/User';

export interface IUserRepository {
  findAll(tenantId: string): Promise<User[]>;
  findById(id: string, tenantId: string): Promise<User | null>;
  create(user: Omit<User, 'id'>): Promise<User>;
  update(id: string, user: Partial<User>, tenantId: string): Promise<User>;
  disable(id: string, tenantId: string): Promise<void>;
}
