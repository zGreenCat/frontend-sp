import { IUserRepository, PaginatedResponse } from '@/domain/repositories/IUserRepository';
import { User } from '@/domain/entities/User';
import { Result, success, failure } from '@/shared/types/Result';

export class ListUsers {
  constructor(private userRepo: IUserRepository) {}

  async execute(tenantId: string, page?: number, limit?: number): Promise<Result<PaginatedResponse<User>>> {
    try {
      const users = await this.userRepo.findAll(tenantId, page, limit);
      return success(users);
    } catch (error) {
      return failure('Error al listar usuarios');
    }
  }
}
