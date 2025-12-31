import { IBoxRepository, MoveBoxDTO } from '@/domain/repositories/IBoxRepository';
import { Box } from '@/domain/entities/Box';
import { Result, success, failure } from '@/shared/types/Result';

export class MoveBox {
  constructor(private boxRepo: IBoxRepository) {}

  async execute(id: string, data: MoveBoxDTO, tenantId: string): Promise<Result<Box>> {
    try {
      const box = await this.boxRepo.move(id, data, tenantId);
      return success(box);
    } catch (error: any) {
      // Manejo específico para error de capacidad insuficiente
      if (error?.statusCode === 400 && error?.message?.includes('capacidad')) {
        return failure('La bodega destino no tiene capacidad suficiente para esta caja.');
      }
      return failure(error?.message || 'Error al mover caja');
    }
  }
}
