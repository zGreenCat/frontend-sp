import { IProviderRepository } from '@/domain/repositories/IProviderRepository';
import { Provider } from '@/domain/entities/Provider';

const MOCK_PROVIDERS: Provider[] = [
  {
    id: '1',
    name: 'Proveedor Industrial SA',
    status: 'ACTIVO',
    productsCount: 15,
    tenantId: 'kreatech-demo',
  },
  {
    id: '2',
    name: 'Suministros Técnicos Ltda',
    status: 'ACTIVO',
    productsCount: 8,
    tenantId: 'kreatech-demo',
  },
];

const providers = [...MOCK_PROVIDERS];

export class MockProviderRepository implements IProviderRepository {
  async findAll(tenantId: string): Promise<Provider[]> {
    await this.simulateLatency();
    return providers.filter(p => p.tenantId === tenantId);
  }

  async findById(id: string, tenantId: string): Promise<Provider | null> {
    await this.simulateLatency();
    return providers.find(p => p.id === id && p.tenantId === tenantId) || null;
  }

  async create(provider: Omit<Provider, 'id'>): Promise<Provider> {
    await this.simulateLatency();
    const newProvider: Provider = {
      ...provider,
      id: Date.now().toString(),
    };
    providers.push(newProvider);
    return newProvider;
  }

  async update(id: string, updates: Partial<Provider>, tenantId: string): Promise<Provider> {
    await this.simulateLatency();
    const index = providers.findIndex(p => p.id === id && p.tenantId === tenantId);
    if (index === -1) throw new Error('Provider not found');
    providers[index] = { ...providers[index], ...updates };
    return providers[index];
  }

  private simulateLatency(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}
