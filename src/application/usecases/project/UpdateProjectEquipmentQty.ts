import { IProjectRepository, UpdateEquipmentQtyDTO, ProjectEquipmentAssignment } from '@/domain/repositories/IProjectRepository';
import { Result } from '@/shared/types/Result';

export class UpdateProjectEquipmentQty {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(projectId: string, equipmentId: string, dto: UpdateEquipmentQtyDTO): Promise<Result<ProjectEquipmentAssignment>> {
    return this.projectRepo.updateEquipmentQty(projectId, equipmentId, dto);
  }
}
