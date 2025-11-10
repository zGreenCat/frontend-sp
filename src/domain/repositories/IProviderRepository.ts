import { Provider } from '../entities/Provider';

export interface IProviderRepository {
  findAll(tenantId: string): Promise<Provider[]>;
  findById(id: string, tenantId: string): Promise<Provider | null>;
  create(provider: Omit<Provider, 'id'>): Promise<Provider>;
  update(id: string, provider: Partial<Provider>, tenantId: string): Promise<Provider>;
}
