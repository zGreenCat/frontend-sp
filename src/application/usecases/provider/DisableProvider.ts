import { IProviderRepository } from '@/domain/repositories/IProviderRepository';
import { Result, success, failure } from '@/shared/types/Result';

export class DisableProvider {
  constructor(private providerRepo: IProviderRepository) {}

  async execute(id: string, tenantId: string): Promise<Result<void>> {
    try {
      // Deshabilitar proveedor (cambiar status a 'INACTIVO')
      await this.providerRepo.update(id, { status: 'INACTIVO' }, tenantId);
      return success(undefined);
    } catch {
      return failure('Error al deshabilitar proveedor');
    }
  }
}
