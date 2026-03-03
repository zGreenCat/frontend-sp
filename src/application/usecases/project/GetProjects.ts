import { IProjectRepository, PaginatedResponse, ProjectQueryParams } from '@/domain/repositories/IProjectRepository';
import { Project } from '@/domain/entities/Project';
import { Result } from '@/shared/types/Result';

export class GetProjects {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(params: ProjectQueryParams): Promise<Result<PaginatedResponse<Project>>> {
    return this.projectRepo.getProjects(params);
  }
}
