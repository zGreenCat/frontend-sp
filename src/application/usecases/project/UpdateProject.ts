import { IProjectRepository, UpdateProjectDTO } from '@/domain/repositories/IProjectRepository';
import { Project } from '@/domain/entities/Project';
import { Result } from '@/shared/types/Result';

export class UpdateProject {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(id: string, payload: UpdateProjectDTO): Promise<Result<Project>> {
    return this.projectRepo.updateProject(id, payload);
  }
}
