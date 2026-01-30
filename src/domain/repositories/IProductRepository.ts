import { Product, ProductKind } from '../entities/Product';
import { PaginatedResponse } from '@/shared/types/pagination.types';

/**
 * Filtros para listar productos
 */
export interface ListProductsParams {
  kind?: ProductKind; // Tipo de producto: EQUIPMENT, MATERIAL, SPARE_PART
  page?: number;
  limit?: number;
  search?: string; // Busca en nombre o descripción
  status?: string; // Filtro por estado
}

/**
 * Repositorio de productos unificado
 * Actúa como fachada sobre los endpoints reales del backend:
 * - GET /equipments
 * - GET /materials
 * - GET /spare-parts
 */
export interface IProductRepository {
  /**
   * Lista productos con filtros opcionales
   * @param params - Parámetros de filtrado y paginación
   * @returns Lista paginada de productos
   */
  list(params: ListProductsParams): Promise<PaginatedResponse<Product>>;

  /**
   * Busca un producto por ID y tipo
   * @param id - ID del producto
   * @param kind - Tipo de producto (EQUIPMENT, MATERIAL, SPARE_PART)
   * @returns Producto encontrado o null si no existe
   */
  findById(id: string, kind: ProductKind): Promise<Product | null>;
}
