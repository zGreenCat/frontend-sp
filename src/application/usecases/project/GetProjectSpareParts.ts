import { IProjectRepository, ProjectSparePartAssignment } from '@/domain/repositories/IProjectRepository';
import { Result } from '@/shared/types/Result';

export class GetProjectSpareParts {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(projectId: string): Promise<Result<ProjectSparePartAssignment[]>> {
    return this.projectRepo.getProjectSpareParts(projectId);
  }
}
