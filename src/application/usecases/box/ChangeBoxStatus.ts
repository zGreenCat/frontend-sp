import { IBoxRepository, ChangeStatusDTO } from '@/domain/repositories/IBoxRepository';
import { Box } from '@/domain/entities/Box';
import { Result, success, failure } from '@/shared/types/Result';

export class ChangeBoxStatus {
  constructor(private boxRepo: IBoxRepository) {}

  async execute(id: string, data: ChangeStatusDTO, tenantId: string): Promise<Result<Box>> {
    try {
      const box = await this.boxRepo.changeStatus(id, data, tenantId);
      return success(box);
    } catch (error: any) {
      return failure(error?.message || 'Error al cambiar estado de caja');
    }
  }
}
