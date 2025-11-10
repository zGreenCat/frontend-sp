import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { Project } from '@/domain/entities/Project';
import { Result, success, failure } from '@/shared/types/Result';

export class CreateProject {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(projectData: Omit<Project, 'id'>): Promise<Result<Project>> {
    try {
      const project = await this.projectRepo.create(projectData);
      return success(project);
    } catch {
      return failure('Error al crear proyecto');
    }
  }
}
