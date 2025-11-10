import { IAreaRepository } from '@/domain/repositories/IAreaRepository';
import { Area } from '@/domain/entities/Area';

const MOCK_AREAS: Area[] = [
  {
    id: '1',
    name: 'Operaciones',
    level: 1,
    status: 'ACTIVO',
    tenantId: 'kreatech-demo',
  },
  {
    id: '2',
    name: 'Logística',
    level: 2,
    parentId: '1',
    status: 'ACTIVO',
    tenantId: 'kreatech-demo',
  },
  {
    id: '3',
    name: 'Almacenamiento',
    level: 2,
    parentId: '1',
    status: 'ACTIVO',
    tenantId: 'kreatech-demo',
  },
];

let areas = [...MOCK_AREAS];

export class MockAreaRepository implements IAreaRepository {
  async findAll(tenantId: string): Promise<Area[]> {
    await this.simulateLatency();
    return areas.filter(a => a.tenantId === tenantId);
  }

  async findById(id: string, tenantId: string): Promise<Area | null> {
    await this.simulateLatency();
    return areas.find(a => a.id === id && a.tenantId === tenantId) || null;
  }

  async create(area: Omit<Area, 'id'>): Promise<Area> {
    await this.simulateLatency();
    const newArea: Area = {
      ...area,
      id: Date.now().toString(),
    };
    areas.push(newArea);
    return newArea;
  }

  async update(id: string, updates: Partial<Area>, tenantId: string): Promise<Area> {
    await this.simulateLatency();
    const index = areas.findIndex(a => a.id === id && a.tenantId === tenantId);
    if (index === -1) throw new Error('Area not found');
    areas[index] = { ...areas[index], ...updates };
    return areas[index];
  }

  private simulateLatency(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}
