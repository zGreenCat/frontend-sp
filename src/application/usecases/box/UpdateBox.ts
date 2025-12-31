import { IBoxRepository, UpdateBoxDTO } from '@/domain/repositories/IBoxRepository';
import { Box } from '@/domain/entities/Box';
import { Result, success, failure } from '@/shared/types/Result';

export class UpdateBox {
  constructor(private boxRepo: IBoxRepository) {}

  async execute(id: string, data: UpdateBoxDTO, tenantId: string): Promise<Result<Box>> {
    try {
      const box = await this.boxRepo.update(id, data, tenantId);
      return success(box);
    } catch (error: any) {
      return failure(error?.message || 'Error al actualizar caja');
    }
  }
}
