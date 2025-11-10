import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Product } from '@/domain/entities/Product';
import { Result, success, failure } from '@/shared/types/Result';

export class ListProducts {
  constructor(private productRepo: IProductRepository) {}

  async execute(tenantId: string): Promise<Result<Product[]>> {
    try {
      const products = await this.productRepo.findAll(tenantId);
      return success(products);
    } catch {
      return failure('Error al listar productos');
    }
  }
}
