import { IProductRepository, UpdateProductInput } from '@/domain/repositories/IProductRepository';
import { Product, ProductKind } from '@/domain/entities/Product';
import { Result, success, failure } from '@/shared/types/Result';

/**
 * Caso de uso: Actualizar un producto existente
 * 
 * Este caso de uso encapsula la lógica de actualización de productos,
 * delegando al repositorio la persistencia real.
 */
export class UpdateProduct {
  constructor(private productRepo: IProductRepository) {}

  /**
   * Ejecuta la actualización de un producto
   * @param id - ID del producto a actualizar
   * @param kind - Tipo de producto (para enrutar al endpoint correcto)
   * @param input - Datos del producto a actualizar (campos opcionales)
   * @returns Result con el producto actualizado o error
   */
  async execute(id: string, kind: ProductKind, input: UpdateProductInput): Promise<Result<Product>> {
    try {
      // Validaciones de negocio adicionales
      if (!id || id.trim().length === 0) {
        return failure('El ID del producto es requerido');
      }

      // Si se intenta actualizar el nombre, validar que no esté vacío
      if (input.name !== undefined && input.name.trim().length === 0) {
        return failure('El nombre del producto no puede estar vacío');
      }

      // Si se intenta actualizar el SKU, validar que no esté vacío
      if (input.sku !== undefined && input.sku.trim().length === 0) {
        return failure('El código (SKU) del producto no puede estar vacío');
      }

      // Validar campos específicos según el tipo si se están actualizando
      if (kind === 'MATERIAL' && input.unitOfMeasure !== undefined && !input.unitOfMeasure) {
        return failure('La unidad de medida es requerida para materiales');
      }

      if ((kind === 'EQUIPMENT' || kind === 'SPARE_PART') && input.model !== undefined && !input.model) {
        return failure('El modelo es requerido para equipos y repuestos');
      }

      // Delegar al repositorio
      const product = await this.productRepo.update(id, kind, input);
      
      return success(product);
    } catch (error) {
      console.error('[UpdateProduct] Error:', error);
      
      // Intentar extraer mensaje de error del backend
      const errorMessage = (error as any)?.message || 'Error al actualizar el producto';
      
      return failure(errorMessage);
    }
  }
}
