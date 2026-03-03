import { IProjectRepository, AssignMaterialDTO, ProjectMaterialAssignment } from '@/domain/repositories/IProjectRepository';
import { Result } from '@/shared/types/Result';

export class AssignProjectMaterial {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(projectId: string, dto: AssignMaterialDTO): Promise<Result<ProjectMaterialAssignment>> {
    return this.projectRepo.assignMaterial(projectId, dto);
  }
}
