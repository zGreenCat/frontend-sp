import { IBoxRepository } from '@/domain/repositories/IBoxRepository';
import { BoxMaterial } from '@/domain/entities/BoxMaterial';

export class AddMaterialToBox {
  constructor(private boxRepo: IBoxRepository) {}

  async execute(
    boxId: string,
    input: { materialId: string; quantity: number; reason?: string },
    tenantId: string
  ): Promise<BoxMaterial> {
    return await this.boxRepo.addMaterial(boxId, input, tenantId);
  }
}
