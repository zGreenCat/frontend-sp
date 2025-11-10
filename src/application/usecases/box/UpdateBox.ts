import { IBoxRepository } from '@/domain/repositories/IBoxRepository';
import { Box } from '@/domain/entities/Box';
import { Result, success, failure } from '@/shared/types/Result';

export class UpdateBox {
  constructor(private boxRepo: IBoxRepository) {}

  async execute(id: string, updates: Partial<Box>, tenantId: string): Promise<Result<Box>> {
    try {
      const box = await this.boxRepo.update(id, updates, tenantId);
      return success(box);
    } catch {
      return failure('Error al actualizar caja');
    }
  }
}
