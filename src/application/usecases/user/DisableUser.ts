import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Result, success, failure } from '@/shared/types/Result';

export class DisableUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string, tenantId: string): Promise<Result<void>> {
    try {
      await this.userRepo.disable(id, tenantId);
      return success(undefined);
    } catch (error) {
      return failure('Error al deshabilitar usuario');
    }
  }
}
