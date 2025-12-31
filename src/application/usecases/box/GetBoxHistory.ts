import { IBoxRepository, HistoryFilters, HistoryResponse } from '@/domain/repositories/IBoxRepository';
import { Result, success, failure } from '@/shared/types/Result';

export class GetBoxHistory {
  constructor(private boxRepo: IBoxRepository) {}

  async execute(boxId: string, tenantId: string, filters?: HistoryFilters): Promise<Result<HistoryResponse>> {
    try {
      const history = await this.boxRepo.getHistory(boxId, tenantId, filters);
      return success(history);
    } catch (error: any) {
      return failure(error?.message || 'Error al obtener historial');
    }
  }
}
