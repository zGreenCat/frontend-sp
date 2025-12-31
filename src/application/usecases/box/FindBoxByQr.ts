import { IBoxRepository } from '@/domain/repositories/IBoxRepository';
import { Box } from '@/domain/entities/Box';
import { Result, success, failure } from '@/shared/types/Result';

export class FindBoxByQr {
  constructor(private boxRepo: IBoxRepository) {}

  async execute(qrCode: string, tenantId: string): Promise<Result<Box | null>> {
    try {
      const box = await this.boxRepo.findByQrCode(qrCode, tenantId);
      return success(box);
    } catch (error: any) {
      return failure(error?.message || 'Error al buscar caja por QR');
    }
  }
}
