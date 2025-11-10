import { IBoxRepository } from '@/domain/repositories/IBoxRepository';
import { Box } from '@/domain/entities/Box';
import { Result, success, failure } from '@/shared/types/Result';

export class GetBoxDetail {
  constructor(private boxRepo: IBoxRepository) {}

  async execute(id: string, tenantId: string): Promise<Result<Box | null>> {
    try {
      const box = await this.boxRepo.findById(id, tenantId);
      return success(box);
    } catch {
      return failure('Error al obtener detalle de caja');
    }
  }
}
