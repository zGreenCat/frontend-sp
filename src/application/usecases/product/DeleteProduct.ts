import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { ProductKind } from '@/domain/entities/Product';
import { Result, success, failure } from '@/shared/types/Result';

/**
 * Caso de uso: Eliminar un producto (soft delete)
 * 
 * Este caso de uso encapsula la lógica de eliminación de productos,
 * delegando al repositorio la ejecución del soft delete.
 */
export class DeleteProduct {
  constructor(private productRepo: IProductRepository) {}

  /**
   * Ejecuta la eliminación de un producto
   * @param id - ID del producto a eliminar
   * @param kind - Tipo de producto (EQUIPMENT, MATERIAL, SPARE_PART)
   * @returns Result con éxito o error
   */
  async execute(id: string, kind: ProductKind): Promise<Result<void>> {
    try {
      // Validaciones básicas
      if (!id || id.trim().length === 0) {
        return failure('El ID del producto es requerido');
      }

      if (!kind) {
        return failure('El tipo de producto es requerido');
      }

      // Delegar al repositorio
      await this.productRepo.delete(id, kind);
      
      return success(undefined);
    } catch (error) {
      console.error('[DeleteProduct] Error:', error);
      
      // Intentar extraer mensaje de error del backend
      const errorMessage = (error as any)?.message || 'Error al eliminar el producto';
      
      return failure(errorMessage);
    }
  }
}
