import { IAreaRepository } from '@/domain/repositories/IAreaRepository';
import { Area } from '@/domain/entities/Area';
import { Result, success, failure } from '@/shared/types/Result';

export class ListAreas {
  constructor(private areaRepo: IAreaRepository) {}

  async execute(tenantId: string): Promise<Result<Area[]>> {
    try {
      const areas = await this.areaRepo.findAll(tenantId);
      return success(areas);
    } catch (error) {
      return failure('Error al listar áreas');
    }
  }
}
