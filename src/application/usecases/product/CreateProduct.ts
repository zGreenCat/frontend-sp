import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Product } from '@/domain/entities/Product';
import { Result, success, failure } from '@/shared/types/Result';

export class CreateProduct {
  constructor(private productRepo: IProductRepository) {}

  async execute(productData: Omit<Product, 'id'>): Promise<Result<Product>> {
    try {
      const product = await this.productRepo.create(productData);
      return success(product);
    } catch {
      return failure('Error al crear producto');
    }
  }
}
