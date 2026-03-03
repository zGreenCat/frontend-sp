import { IProjectRepository, ProjectMaterialAssignment } from '@/domain/repositories/IProjectRepository';
import { Result } from '@/shared/types/Result';

export class GetProjectMaterials {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(projectId: string): Promise<Result<ProjectMaterialAssignment[]>> {
    return this.projectRepo.getProjectMaterials(projectId);
  }
}
