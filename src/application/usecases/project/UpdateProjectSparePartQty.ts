import { IProjectRepository, UpdateSparePartQtyDTO, ProjectSparePartAssignment } from '@/domain/repositories/IProjectRepository';
import { Result } from '@/shared/types/Result';

export class UpdateProjectSparePartQty {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(projectId: string, sparePartId: string, dto: UpdateSparePartQtyDTO): Promise<Result<ProjectSparePartAssignment>> {
    return this.projectRepo.updateSparePartQty(projectId, sparePartId, dto);
  }
}
