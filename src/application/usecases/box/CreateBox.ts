import { IBoxRepository } from '@/domain/repositories/IBoxRepository';
import { Box } from '@/domain/entities/Box';
import { Result, success, failure } from '@/shared/types/Result';

export class CreateBox {
  constructor(private boxRepo: IBoxRepository) {}

  async execute(boxData: Omit<Box, 'id'>): Promise<Result<Box>> {
    try {
      const box = await this.boxRepo.create(boxData);
      return success(box);
    } catch {
      return failure('Error al crear caja');
    }
  }
}
