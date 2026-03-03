import { IProjectRepository, AssignSparePartDTO, ProjectSparePartAssignment } from '@/domain/repositories/IProjectRepository';
import { Result } from '@/shared/types/Result';

export class AssignProjectSparePart {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(projectId: string, dto: AssignSparePartDTO): Promise<Result<ProjectSparePartAssignment>> {
    return this.projectRepo.assignSparePart(projectId, dto);
  }
}
