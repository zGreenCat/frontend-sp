import { IBoxRepository } from '@/domain/repositories/IBoxRepository';
import { Box } from '@/domain/entities/Box';
import { Result, success, failure } from '@/shared/types/Result';

export class DeactivateBox {
  constructor(private boxRepo: IBoxRepository) {}

  async execute(id: string, tenantId: string): Promise<Result<Box>> {
    try {
      const box = await this.boxRepo.deactivate(id, tenantId);
      return success(box);
    } catch (error: any) {
      // Manejo específico para error de stock > 0
      if (error?.statusCode === 400 && error?.message?.includes('stock')) {
        return failure('No se puede desactivar la caja porque aún tiene stock asignado.');
      }
      return failure(error?.message || 'Error al desactivar caja');
    }
  }
}
