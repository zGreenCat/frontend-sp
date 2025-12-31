import { IBoxRepository, BoxListFilters, BoxListResponse } from '@/domain/repositories/IBoxRepository';
import { Result, success, failure } from '@/shared/types/Result';

export class ListBoxes {
  constructor(private boxRepo: IBoxRepository) {}

  async execute(tenantId: string, filters?: BoxListFilters): Promise<Result<BoxListResponse>> {
    try {
      const response = await this.boxRepo.findAll(tenantId, filters);
      return success(response);
    } catch (error: any) {
      return failure(error?.message || 'Error al listar cajas');
    }
  }
}
