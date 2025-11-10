import { IProviderRepository } from '@/domain/repositories/IProviderRepository';
import { Provider } from '@/domain/entities/Provider';
import { Result, success, failure } from '@/shared/types/Result';

export class UpdateProvider {
  constructor(private providerRepo: IProviderRepository) {}

  async execute(id: string, updates: Partial<Provider>, tenantId: string): Promise<Result<Provider>> {
    try {
      const provider = await this.providerRepo.update(id, updates, tenantId);
      return success(provider);
    } catch {
      return failure('Error al actualizar proveedor');
    }
  }
}
