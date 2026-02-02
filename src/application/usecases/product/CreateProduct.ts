import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { CreateProductInput } from '@/shared/schemas';
import { Product } from '@/domain/entities/Product';
import { Result, success, failure } from '@/shared/types/Result';

/**
 * Caso de uso: Crear un nuevo producto
 * 
 * Este caso de uso encapsula la lógica de creación de productos,
 * delegando al repositorio la persistencia real.
 */
export class CreateProduct {
  constructor(private productRepo: IProductRepository) {}

  /**
   * Ejecuta la creación de un producto
   * @param input - Datos del producto a crear
   * @returns Result con el producto creado o error
   */
  async execute(input: CreateProductInput): Promise<Result<Product>> {
    try {
      // Validaciones de negocio adicionales si fuera necesario
      if (!input.name || input.name.trim().length === 0) {
        return failure('El nombre del producto es requerido');
      }

      // ✅ SKU removido - lo genera el backend automáticamente

      // Validar campos específicos según el tipo
      if (input.kind === 'MATERIAL' && !input.unitOfMeasureId) {
        return failure('La unidad de medida es requerida para materiales');
      }

      if (input.kind === 'EQUIPMENT' && !input.model) {
        return failure('El modelo es requerido para equipos');
      }

      // Validar dimensiones para equipos y repuestos
      if (input.kind === 'EQUIPMENT' || input.kind === 'SPARE_PART') {
        if (!input.weightValue || !input.weightUnitId) {
          return failure('El peso y su unidad son requeridos');
        }
        if (!input.widthValue || !input.widthUnitId) {
          return failure('El ancho y su unidad son requeridos');
        }
        if (!input.heightValue || !input.heightUnitId) {
          return failure('El alto y su unidad son requeridos');
        }
        if (!input.lengthValue || !input.lengthUnitId) {
          return failure('El largo y su unidad son requeridos');
        }
      }

      if (!input.currencyId) {
        return failure('La moneda es requerida');
      }

      if (!input.monetaryValue) {
        return failure('El valor monetario es requerido');
      }

      // Delegar al repositorio
      const product = await this.productRepo.create(input);
      
      return success(product);
    } catch (error) {
      console.error('[CreateProduct] Error:', error);
      
      // Intentar extraer mensaje de error del backend
      const errorMessage = (error as any)?.message || 'Error al crear el producto';
      
      return failure(errorMessage);
    }
  }
}
