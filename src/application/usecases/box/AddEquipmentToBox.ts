import { IBoxRepository } from '@/domain/repositories/IBoxRepository';
import { BoxEquipment } from '@/domain/entities/BoxEquipment';

export class AddEquipmentToBox {
  constructor(private boxRepo: IBoxRepository) {}

  async execute(
    boxId: string,
    input: { equipmentId: string; quantity: number; reason?: string },
    tenantId: string
  ): Promise<BoxEquipment> {
    return await this.boxRepo.addEquipment(boxId, input, tenantId);
  }
}
