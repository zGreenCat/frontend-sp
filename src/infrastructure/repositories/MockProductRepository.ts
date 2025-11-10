import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Product } from '@/domain/entities/Product';

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    sku: 'EQ-001',
    description: 'Compresor Industrial 5HP',
    type: 'EQUIPO',
    status: 'ACTIVO',
    uom: 'UND',
    unitCost: 850000,
    currency: 'CLP',
    providerId: '1',
    projectId: '1',
    tenantId: 'kreatech-demo',
  },
  {
    id: '2',
    sku: 'MAT-002',
    description: 'Cable eléctrico calibre 12',
    type: 'MATERIAL',
    status: 'ACTIVO',
    uom: 'MTS',
    unitCost: 1200,
    currency: 'CLP',
    providerId: '1',
    projectId: '1',
    tenantId: 'kreatech-demo',
  },
  {
    id: '3',
    sku: 'REP-003',
    description: 'Filtro de aire para compresor',
    type: 'REPUESTO',
    status: 'ACTIVO',
    uom: 'UND',
    unitCost: 45000,
    currency: 'CLP',
    providerId: '2',
    projectId: '2',
    tenantId: 'kreatech-demo',
  },
  {
    id: '4',
    sku: 'MAT-004',
    description: 'Tornillos inoxidables M8',
    type: 'MATERIAL',
    status: 'ACTIVO',
    uom: 'UND',
    unitCost: 350,
    currency: 'CLP',
    providerId: '2',
    tenantId: 'kreatech-demo',
  },
  {
    id: '5',
    sku: 'EQ-005',
    description: 'Bomba centrífuga 3HP',
    type: 'EQUIPO',
    status: 'INACTIVO',
    uom: 'UND',
    unitCost: 650000,
    currency: 'CLP',
    providerId: '1',
    projectId: '2',
    tenantId: 'kreatech-demo',
  },
];

let products = [...MOCK_PRODUCTS];

export class MockProductRepository implements IProductRepository {
  async findAll(tenantId: string): Promise<Product[]> {
    await this.simulateLatency();
    return products.filter(p => p.tenantId === tenantId);
  }

  async findById(id: string, tenantId: string): Promise<Product | null> {
    await this.simulateLatency();
    return products.find(p => p.id === id && p.tenantId === tenantId) || null;
  }

  async create(product: Omit<Product, 'id'>): Promise<Product> {
    await this.simulateLatency();
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
    };
    products.push(newProduct);
    return newProduct;
  }

  async update(id: string, updates: Partial<Product>, tenantId: string): Promise<Product> {
    await this.simulateLatency();
    const index = products.findIndex(p => p.id === id && p.tenantId === tenantId);
    if (index === -1) throw new Error('Product not found');
    products[index] = { ...products[index], ...updates };
    return products[index];
  }

  private simulateLatency(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}
