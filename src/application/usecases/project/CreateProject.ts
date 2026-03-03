import { IProjectRepository, CreateProjectDTO } from '@/domain/repositories/IProjectRepository';
import { Project } from '@/domain/entities/Project';
import { Result } from '@/shared/types/Result';

export class CreateProject {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(payload: CreateProjectDTO): Promise<Result<Project>> {
    return this.projectRepo.createProject(payload);
  }
}
