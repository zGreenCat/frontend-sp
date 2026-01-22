import { IBoxRepository } from '@/domain/repositories/IBoxRepository';

export class RemoveMaterialFromBox {
  constructor(private boxRepo: IBoxRepository) {}

  async execute(
    boxId: string,
    assignmentId: string,
    tenantId: string,
    reason?: string
  ): Promise<void> {
    await this.boxRepo.removeMaterial(boxId, assignmentId, tenantId, reason);
  }
}
