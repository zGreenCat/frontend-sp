import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { Result } from '@/shared/types/Result';

export class RemoveProjectEquipment {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(projectId: string, equipmentId: string): Promise<Result<void>> {
    return this.projectRepo.removeEquipment(projectId, equipmentId);
  }
}
