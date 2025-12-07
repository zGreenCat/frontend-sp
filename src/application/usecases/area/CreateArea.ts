import { IAreaRepository } from '@/domain/repositories/IAreaRepository';
import { Area } from '@/domain/entities/Area';
import { Result, success, failure } from '@/shared/types/Result';
import { CreateAreaInput } from '@/shared';

export type CreateAreaDTO = {
  name: string;
  parentId: string | null;
};


export class CreateArea {
  constructor(private areaRepo: IAreaRepository) {}

  async execute(input: CreateAreaInput): Promise<Result<Area>> {
    try {
      const dto: CreateAreaDTO = {
        name: input.name,
        parentId: input.parentId ?? null,
      };

      const area = await this.areaRepo.create(dto);
      return success(area);
    } catch {
      return failure("Error al crear área");
    }
  }
}
