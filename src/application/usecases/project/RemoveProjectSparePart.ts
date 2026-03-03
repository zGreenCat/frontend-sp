import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { Result } from '@/shared/types/Result';

export class RemoveProjectSparePart {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(projectId: string, sparePartId: string): Promise<Result<void>> {
    return this.projectRepo.removeSparePart(projectId, sparePartId);
  }
}
