import { IAreaRepository } from '@/domain/repositories/IAreaRepository';
import { Area } from '@/domain/entities/Area';
import { Result, success, failure } from '@/shared/types/Result';

export class UpdateArea {
  constructor(private areaRepo: IAreaRepository) {}

  async execute(id: string, updates: Partial<Area>, tenantId: string): Promise<Result<Area>> {
    try {
      const area = await this.areaRepo.update(id, updates, tenantId);
      return success(area);
    } catch (error) {
      return failure('Error al actualizar área');
    }
  }
}
