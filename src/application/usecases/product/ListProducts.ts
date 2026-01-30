import { IProductRepository, ListProductsParams } from '@/domain/repositories/IProductRepository';
import { Product } from '@/domain/entities/Product';
import { PaginatedResponse } from '@/shared/types/pagination.types';

/**
 * Caso de uso: Listar productos con filtros
 */
export class ListProducts {
  constructor(private productRepo: IProductRepository) {}

  async execute(params: ListProductsParams): Promise<PaginatedResponse<Product>> {
    return await this.productRepo.list(params);
  }
}

