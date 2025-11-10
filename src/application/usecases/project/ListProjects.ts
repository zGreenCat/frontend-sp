import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { Project } from '@/domain/entities/Project';
import { Result, success, failure } from '@/shared/types/Result';

export class ListProjects {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(tenantId: string): Promise<Result<Project[]>> {
    try {
      const projects = await this.projectRepo.findAll(tenantId);
      return success(projects);
    } catch {
      return failure('Error al listar proyectos');
    }
  }
}
