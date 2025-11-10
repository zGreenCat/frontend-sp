import { IProviderRepository } from '@/domain/repositories/IProviderRepository';
import { Provider } from '@/domain/entities/Provider';
import { Result, success, failure } from '@/shared/types/Result';

export class CreateProvider {
  constructor(private providerRepo: IProviderRepository) {}

  async execute(providerData: Omit<Provider, 'id'>): Promise<Result<Provider>> {
    try {
      const provider = await this.providerRepo.create(providerData);
      return success(provider);
    } catch {
      return failure('Error al crear proveedor');
    }
  }
}
