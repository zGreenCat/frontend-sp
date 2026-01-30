import { Product, ProductKind, Currency } from '../entities/Product';
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
}
