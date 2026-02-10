import { Product, ProductKind, Currency } from '../entities/Product';
import { ProductHistoryEvent, ProductHistoryFilters } from '../entities/ProductHistory';
import { PaginatedResponse } from '@/shared/types/pagination.types';
import { CreateProductInput, UpdateProductInput } from '@/shared/schemas';

/**
 * Filtros para listar productos (base)
 * Compatible con backend DTOs
 */
export interface ListProductsParams {
  kind?: ProductKind; // Tipo de producto: EQUIPMENT, MATERIAL, SPARE_PART
  page?: number;
  limit?: number;
  search?: string; // Busca en nombre o descripción
  isActive?: boolean; // Filtro por estado activo/inactivo
  currencyId?: string; // Filtro por moneda (UUID)
  
  // Filtros específicos de Spare Parts
  category?: 'COMPONENT' | 'SPARE'; // Solo para SPARE_PART
  equipmentId?: string; // Solo para SPARE_PART (UUID)
  
  // Filtros específicos de Materials
  unitOfMeasureId?: string; // Solo para MATERIAL (UUID)
  isHazardous?: boolean; // Solo para MATERIAL
}

/**
 * Repositorio de productos unificado
 * Actúa como fachada sobre los endpoints reales del backend:
 * - POST/GET /equipment
 * - POST/GET /materials
 * - POST/GET /spare-parts
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

  /**
   * Crea un nuevo producto
   * @param input - Datos del producto a crear
   * @returns Producto creado con ID asignado por el backend
   */
  create(input: CreateProductInput): Promise<Product>;

  /**
   * Actualiza un producto existente
   * @param id - ID del producto a actualizar
   * @param kind - Tipo de producto (para enrutar al endpoint correcto)
   * @param input - Datos del producto a actualizar (campos opcionales)
   * @returns Producto actualizado
   */
  update(id: string, kind: ProductKind, input: UpdateProductInput): Promise<Product>;

  /**
   * Elimina un producto (soft delete)
   * @param id - ID del producto a eliminar
   * @param kind - Tipo de producto (para enrutar al endpoint correcto)
   * @returns Promise<void>
   */
  delete(id: string, kind: ProductKind): Promise<void>;

  /**
   * Obtiene el historial de cambios de un producto
   * @param id - ID del producto
   * @param kind - Tipo de producto (para enrutar al endpoint correcto)
   * @param filters - Filtros opcionales (paginación, rango de fechas, tipo de evento)
   * @returns Historial paginado de eventos del producto
   * 
   * Nota: Actualmente el backend no expone este endpoint.
   * Cuando se implemente, el endpoint esperado sería:
   * - GET /equipment/:id/history
   * - GET /materials/:id/history
   * - GET /spare-parts/:id/history
   */
  getHistory(
    id: string,
    kind: ProductKind,
    filters?: ProductHistoryFilters
  ): Promise<PaginatedResponse<ProductHistoryEvent>>;
}
