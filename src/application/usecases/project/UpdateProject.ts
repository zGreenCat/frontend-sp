import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { Project } from '@/domain/entities/Project';
import { Result, success, failure } from '@/shared/types/Result';

export class UpdateProject {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(id: string, updates: Partial<Project>, tenantId: string): Promise<Result<Project>> {
    try {
      const project = await this.projectRepo.update(id, updates, tenantId);
      return success(project);
    } catch {
      return failure('Error al actualizar proyecto');
    }
  }
}
