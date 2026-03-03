import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { Project } from '@/domain/entities/Project';
import { Result } from '@/shared/types/Result';

export class GetProjectById {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(id: string): Promise<Result<Project>> {
    return this.projectRepo.getProjectById(id);
  }
}
