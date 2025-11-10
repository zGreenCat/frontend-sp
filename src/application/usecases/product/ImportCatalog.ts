import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Product } from '@/domain/entities/Product';
import { Result, success, failure } from '@/shared/types/Result';

export class ImportCatalog {
  constructor(private productRepo: IProductRepository) {}

  async execute(products: Omit<Product, 'id'>[]): Promise<Result<Product[]>> {
    try {
      // Simulación de importación masiva de catálogo
      const createdProducts: Product[] = [];
      
      for (const productData of products) {
        const product = await this.productRepo.create(productData);
        createdProducts.push(product);
      }
      
      return success(createdProducts);
    } catch {
      return failure('Error al importar catálogo de productos');
    }
  }
}
