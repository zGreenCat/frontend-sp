import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Product } from '@/domain/entities/Product';
import { Result, success, failure } from '@/shared/types/Result';

export class UpdateProduct {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string, updates: Partial<Product>, tenantId: string): Promise<Result<Product>> {
    try {
      const product = await this.productRepo.update(id, updates, tenantId);
      return success(product);
    } catch {
      return failure('Error al actualizar producto');
    }
  }
}
