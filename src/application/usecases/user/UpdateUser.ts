import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { User } from '@/domain/entities/User';
import { Result, success, failure } from '@/shared/types/Result';

export class UpdateUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string, updates: Partial<User>, tenantId: string): Promise<Result<User>> {
    try {
      const user = await this.userRepo.update(id, updates, tenantId);
      return success(user);
    } catch (error) {
      return failure('Error al actualizar usuario');
    }
  }
}
