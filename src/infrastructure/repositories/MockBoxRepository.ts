import { IBoxRepository } from '@/domain/repositories/IBoxRepository';
import { Box } from '@/domain/entities/Box';

const MOCK_BOXES: Box[] = [
  {
    id: '1',
    code: 'BOX-001',
    type: 'ESTANDAR',
    status: 'ACTIVO',
    unitCost: 15000,
    currency: 'CLP',
    history: [
      {
        id: 'h1',
        timestampISO: '2025-01-15T10:30:00Z',
        userId: '1',
        eventType: 'CREACION',
        after: { code: 'BOX-001', type: 'ESTANDAR' },
      },
      {
        id: 'h2',
        timestampISO: '2025-02-20T14:15:00Z',
        userId: '2',
        eventType: 'ACTUALIZACION',
        before: { status: 'INACTIVO' },
        after: { status: 'ACTIVO' },
      },
    ],
    tenantId: 'kreatech-demo',
  },
  {
    id: '2',
    code: 'BOX-002',
    type: 'ESPECIAL',
    status: 'EN_USO',
    unitCost: 25000,
    currency: 'CLP',
    history: [
      {
        id: 'h3',
        timestampISO: '2025-01-20T09:00:00Z',
        userId: '3',
        eventType: 'CREACION',
        after: { code: 'BOX-002', type: 'ESPECIAL' },
      },
    ],
    tenantId: 'kreatech-demo',
  },
  {
    id: '3',
    code: 'BOX-003',
    type: 'REFRIGERADO',
    status: 'ACTIVO',
    unitCost: 50000,
    currency: 'CLP',
    history: [
      {
        id: 'h4',
        timestampISO: '2025-03-01T11:45:00Z',
        userId: '1',
        eventType: 'CREACION',
        after: { code: 'BOX-003', type: 'REFRIGERADO' },
      },
    ],
    tenantId: 'kreatech-demo',
  },
];

let boxes = [...MOCK_BOXES];

export class MockBoxRepository implements IBoxRepository {
  async findAll(tenantId: string): Promise<Box[]> {
    await this.simulateLatency();
    return boxes.filter(b => b.tenantId === tenantId);
  }

  async findById(id: string, tenantId: string): Promise<Box | null> {
    await this.simulateLatency();
    return boxes.find(b => b.id === id && b.tenantId === tenantId) || null;
  }

  async create(box: Omit<Box, 'id'>): Promise<Box> {
    await this.simulateLatency();
    const newBox: Box = {
      ...box,
      id: Date.now().toString(),
    };
    boxes.push(newBox);
    return newBox;
  }

  async update(id: string, updates: Partial<Box>, tenantId: string): Promise<Box> {
    await this.simulateLatency();
    const index = boxes.findIndex(b => b.id === id && b.tenantId === tenantId);
    if (index === -1) throw new Error('Box not found');
    boxes[index] = { ...boxes[index], ...updates };
    return boxes[index];
  }

  private simulateLatency(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}
