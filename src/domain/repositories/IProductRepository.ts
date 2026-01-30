import { Product, ProductKind, Currency } from '../entities/Product';
import { ProductHistoryEvent, ProductHistoryFilters } from '../entities/ProductHistory';
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
 * Input para crear un producto
 * Campos obligatorios y opcionales según el tipo de producto
 */
export interface CreateProductInput {
  // Campos obligatorios para todos los productos
  kind: ProductKind;
  name: string;
  sku: string; // Código del producto
  currency: Currency;
  isActive: boolean;
  
  // Campos opcionales comunes
  description?: string;
  
  // Campos específicos de EQUIPMENT y SPARE_PART
  model?: string;
  
  // Campos específicos de MATERIAL
  unitOfMeasure?: string; // 'KG' | 'LT' | 'UNIT' | etc.
  isHazardous?: boolean;
  categories?: string[]; // IDs de categorías
  
  // Campos opcionales de negocio
  providerId?: string;
  projectId?: string;
}

/**
 * Input para actualizar un producto
 * Todos los campos son opcionales excepto el ID
 * kind no puede cambiar (inmutable)
 */
export interface UpdateProductInput {
  id: string;
  name?: string;
  sku?: string; // Opcional, pero será readonly en UI
  currency?: Currency;
  isActive?: boolean;
  description?: string;
  model?: string;
  unitOfMeasure?: string;
  isHazardous?: boolean;
  categories?: string[];
  providerId?: string;
  projectId?: string;
  
  // TODO: Agregar cuando backend lo soporte
  // justification?: string; // Justificación para cambios sensibles
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
