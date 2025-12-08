import { User } from '../entities/User';

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IUserRepository {
  findAll(tenantId: string, page?: number, limit?: number): Promise<PaginatedResponse<User>>;
  findById(id: string, tenantId: string): Promise<User | null>;
  findByRole(roleName: string, tenantId: string): Promise<PaginatedResponse<User>>;
  create(user: Omit<User, 'id'>): Promise<User>;
  update(id: string, user: Partial<User>, tenantId: string): Promise<User>;
  disable(id: string, tenantId: string): Promise<void>;
  checkEmailExists(email: string, tenantId: string, excludeUserId?: string): Promise<boolean>;
  verifyPassword(userId: string, password: string, tenantId: string): Promise<boolean>;
  changePassword(userId: string, newPassword: string, tenantId: string): Promise<void>;
}
