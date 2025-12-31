import { IBoxRepository, CreateBoxDTO } from '@/domain/repositories/IBoxRepository';
import { Box } from '@/domain/entities/Box';
import { Result, success, failure } from '@/shared/types/Result';

export class CreateBox {
  constructor(private boxRepo: IBoxRepository) {}

  async execute(data: CreateBoxDTO, tenantId: string): Promise<Result<Box>> {
    try {
      const box = await this.boxRepo.create(data, tenantId);
      return success(box);
    } catch (error: any) {
      // Manejo especial para error de qrCode duplicado (409 Conflict)
      if (error?.statusCode === 409) {
        return failure('El código QR ya existe. Por favor usa uno diferente.');
      }
      return failure(error?.message || 'Error al crear caja');
    }
  }
}
