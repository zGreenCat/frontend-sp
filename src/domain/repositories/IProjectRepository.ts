import { Project } from '../entities/Project';

export interface IProjectRepository {
  findAll(tenantId: string): Promise<Project[]>;
  findById(id: string, tenantId: string): Promise<Project | null>;
  create(project: Omit<Project, 'id'>): Promise<Project>;
  update(id: string, project: Partial<Project>, tenantId: string): Promise<Project>;
}
