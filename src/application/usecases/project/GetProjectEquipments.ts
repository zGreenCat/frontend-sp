import { IProjectRepository, ProjectEquipmentAssignment } from '@/domain/repositories/IProjectRepository';
import { Result } from '@/shared/types/Result';

export class GetProjectEquipments {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(projectId: string): Promise<Result<ProjectEquipmentAssignment[]>> {
    return this.projectRepo.getProjectEquipments(projectId);
  }
}
