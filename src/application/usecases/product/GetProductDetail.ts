import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Product, ProductKind } from '@/domain/entities/Product';

/**
 * Caso de uso: Obtener detalle de un producto por ID y tipo
 */
export class GetProductDetail {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string, kind: ProductKind): Promise<Product | null> {
    try {
      const product = await this.productRepo.findById(id, kind);
      return product;
    } catch (error: any) {
      console.error('[GetProductDetail] Error:', error);
      throw error;
    }
  }
}
