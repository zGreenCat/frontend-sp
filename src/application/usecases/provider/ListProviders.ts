import { IProviderRepository } from '@/domain/repositories/IProviderRepository';
import { Provider } from '@/domain/entities/Provider';
import { Result, success, failure } from '@/shared/types/Result';

export class ListProviders {
  constructor(private providerRepo: IProviderRepository) {}

  async execute(tenantId: string): Promise<Result<Provider[]>> {
    try {
      const providers = await this.providerRepo.findAll(tenantId);
      return success(providers);
    } catch {
      return failure('Error al listar proveedores');
    }
  }
}
