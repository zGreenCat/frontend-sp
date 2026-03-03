import { IProjectRepository, UpdateMaterialQtyDTO, ProjectMaterialAssignment } from '@/domain/repositories/IProjectRepository';
import { Result } from '@/shared/types/Result';

export class UpdateProjectMaterialQty {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(projectId: string, materialId: string, dto: UpdateMaterialQtyDTO): Promise<Result<ProjectMaterialAssignment>> {
    return this.projectRepo.updateMaterialQty(projectId, materialId, dto);
  }
}
