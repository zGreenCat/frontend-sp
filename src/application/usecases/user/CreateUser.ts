import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { User } from '@/domain/entities/User';
import { Result, success, failure } from '@/shared/types/Result';

export class CreateUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(userData: Omit<User, 'id'>): Promise<Result<User>> {
    try {
      const user = await this.userRepo.create(userData);
      return success(user);
    } catch (error) {
      return failure('Error al crear usuario');
    }
  }
}
