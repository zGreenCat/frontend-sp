import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { Project } from '@/domain/entities/Project';

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Proyecto Ampliación Planta Norte',
    code: 'PRJ-2025-001',
    status: 'ACTIVO',
    productsCount: 45,
    tenantId: 'kreatech-demo',
  },
  {
    id: '2',
    name: 'Proyecto Modernización Equipos',
    code: 'PRJ-2025-002',
    status: 'ACTIVO',
    productsCount: 23,
    tenantId: 'kreatech-demo',
  },
];

let projects = [...MOCK_PROJECTS];

export class MockProjectRepository implements IProjectRepository {
  async findAll(tenantId: string): Promise<Project[]> {
    await this.simulateLatency();
    return projects.filter(p => p.tenantId === tenantId);
  }

  async findById(id: string, tenantId: string): Promise<Project | null> {
    await this.simulateLatency();
    return projects.find(p => p.id === id && p.tenantId === tenantId) || null;
  }

  async create(project: Omit<Project, 'id'>): Promise<Project> {
    await this.simulateLatency();
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
    };
    projects.push(newProject);
    return newProject;
  }

  async update(id: string, updates: Partial<Project>, tenantId: string): Promise<Project> {
    await this.simulateLatency();
    const index = projects.findIndex(p => p.id === id && p.tenantId === tenantId);
    if (index === -1) throw new Error('Project not found');
    projects[index] = { ...projects[index], ...updates };
    return projects[index];
  }

  private simulateLatency(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}
