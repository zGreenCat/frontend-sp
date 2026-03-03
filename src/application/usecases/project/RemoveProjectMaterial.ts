import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { Result } from '@/shared/types/Result';

export class RemoveProjectMaterial {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(projectId: string, materialId: string): Promise<Result<void>> {
    return this.projectRepo.removeMaterial(projectId, materialId);
  }
}
