import { IProjectRepository, AssignEquipmentDTO, ProjectEquipmentAssignment } from '@/domain/repositories/IProjectRepository';
import { Result } from '@/shared/types/Result';

export class AssignProjectEquipment {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(projectId: string, dto: AssignEquipmentDTO): Promise<Result<ProjectEquipmentAssignment>> {
    return this.projectRepo.assignEquipment(projectId, dto);
  }
}
