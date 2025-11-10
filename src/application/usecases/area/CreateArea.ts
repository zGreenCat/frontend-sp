import { IAreaRepository } from '@/domain/repositories/IAreaRepository';
import { Area } from '@/domain/entities/Area';
import { Result, success, failure } from '@/shared/types/Result';

export class CreateArea {
  constructor(private areaRepo: IAreaRepository) {}

  async execute(areaData: Omit<Area, 'id'>): Promise<Result<Area>> {
    try {
      const area = await this.areaRepo.create(areaData);
      return success(area);
    } catch (error) {
      return failure('Error al crear área');
    }
  }
}
