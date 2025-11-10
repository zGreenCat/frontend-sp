import { IWarehouseRepository } from '@/domain/repositories/IWarehouseRepository';
import { Warehouse } from '@/domain/entities/Warehouse';

const MOCK_WAREHOUSES: Warehouse[] = [
  {
    id: '1',
    name: 'Bodega Central',
    capacityKg: 5000,
    status: 'ACTIVO',
    areaId: '1',
    supervisorId: '2',
    tenantId: 'kreatech-demo',
  },
  {
    id: '2',
    name: 'Bodega Norte',
    capacityKg: 3000,
    status: 'ACTIVO',
    areaId: '2',
    supervisorId: '3',
    tenantId: 'kreatech-demo',
  },
  {
    id: '3',
    name: 'Bodega Sur',
    capacityKg: 4000,
    status: 'ACTIVO',
    areaId: '3',
    supervisorId: '3',
    tenantId: 'kreatech-demo',
  },
  {
    id: '4',
    name: 'Bodega Temporal',
    capacityKg: 1000,
    status: 'INACTIVO',
    areaId: '3',
    supervisorId: '4',
    tenantId: 'kreatech-demo',
  },
];

let warehouses = [...MOCK_WAREHOUSES];

export class MockWarehouseRepository implements IWarehouseRepository {
  async findAll(tenantId: string): Promise<Warehouse[]> {
    await this.simulateLatency();
    return warehouses.filter(w => w.tenantId === tenantId);
  }

  async findById(id: string, tenantId: string): Promise<Warehouse | null> {
    await this.simulateLatency();
    return warehouses.find(w => w.id === id && w.tenantId === tenantId) || null;
  }

  async create(warehouse: Omit<Warehouse, 'id'>): Promise<Warehouse> {
    await this.simulateLatency();
    const newWarehouse: Warehouse = {
      ...warehouse,
      id: Date.now().toString(),
    };
    warehouses.push(newWarehouse);
    return newWarehouse;
  }

  async update(id: string, updates: Partial<Warehouse>, tenantId: string): Promise<Warehouse> {
    await this.simulateLatency();
    const index = warehouses.findIndex(w => w.id === id && w.tenantId === tenantId);
    if (index === -1) throw new Error('Warehouse not found');
    warehouses[index] = { ...warehouses[index], ...updates };
    return warehouses[index];
  }

  private simulateLatency(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}
