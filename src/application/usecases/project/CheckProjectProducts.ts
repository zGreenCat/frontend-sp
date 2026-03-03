import { IProjectRepository, CheckProductsResult } from '@/domain/repositories/IProjectRepository';
import { Result } from '@/shared/types/Result';

export class CheckProjectProducts {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(id: string): Promise<Result<CheckProductsResult>> {
    return this.projectRepo.checkProjectProducts(id);
  }
}
