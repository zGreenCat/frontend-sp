import { IBoxRepository } from '@/domain/repositories/IBoxRepository';

export class RemoveEquipmentFromBox {
  constructor(private boxRepo: IBoxRepository) {}

  async execute(
    boxId: string,
    assignmentId: string,
    tenantId: string,
    reason?: string
  ): Promise<void> {
    await this.boxRepo.removeEquipment(boxId, assignmentId, tenantId, reason);
  }
}
