import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { ProductKind } from '@/domain/entities/Product';
import { ProductHistoryEvent, ProductHistoryFilters } from '@/domain/entities/ProductHistory';
import { PaginatedResponse } from '@/shared/types/pagination.types';
import { Result, success, failure } from '@/shared/types/Result';

/**
 * Caso de uso: Obtener historial de un producto
 * 
 * Este caso de uso encapsula la lógica para obtener el historial de cambios
 * de un producto específico desde los endpoints del backend.
 */
export class GetProductHistory {
  constructor(private productRepo: IProductRepository) {}

  /**
   * Ejecuta la consulta del historial
   * @param id - ID del producto
   * @param kind - Tipo de producto
   * @param filters - Filtros opcionales (paginación, rango de fechas, tipo de evento)
   * @returns Result con el historial paginado o error
   */
  async execute(
    id: string,
    kind: ProductKind,
    filters?: ProductHistoryFilters
  ): Promise<Result<PaginatedResponse<ProductHistoryEvent>>> {
    try {
      // Validaciones básicas
      if (!id || id.trim().length === 0) {
        return failure('El ID del producto es requerido');
      }

      if (!kind) {
        return failure('El tipo de producto es requerido');
      }

      // Delegar al repositorio
      const history = await this.productRepo.getHistory(id, kind, filters);
      
      return success(history);
    } catch (error) {
      console.error('[GetProductHistory] Error:', error);
      
      const errorMessage = (error as Error).message;
      return failure(errorMessage || 'Error al obtener el historial del producto');
    }
  }
}
