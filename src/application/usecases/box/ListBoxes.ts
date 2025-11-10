import { IBoxRepository } from '@/domain/repositories/IBoxRepository';
import { Box } from '@/domain/entities/Box';
import { Result, success, failure } from '@/shared/types/Result';

export class ListBoxes {
  constructor(private boxRepo: IBoxRepository) {}

  async execute(tenantId: string): Promise<Result<Box[]>> {
    try {
      const boxes = await this.boxRepo.findAll(tenantId);
      return success(boxes);
    } catch {
      return failure('Error al listar cajas');
    }
  }
}
