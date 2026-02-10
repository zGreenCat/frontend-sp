/**
 * Tipos para filtros de productos
 * Mapean directamente a los DTOs que el backend acepta
 */

/**
 * Query params base para todos los productos
 */
export interface BaseProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  currencyId?: string;
}

/**
 * Query params específicos para Equipment
 * Backend acepta: page, limit, search (nombre/modelo), isActive, currencyId
 */
export interface EquipmentQuery extends BaseProductQuery {
  // Equipment no tiene filtros adicionales por ahora
}

/**
 * Query params específicos para Spare Parts
 * Backend acepta: page, limit, search (nombre/descripción), category (COMPONENT|SPARE), 
 * currencyId, isActive, equipmentId
 */
export interface SparePartQuery extends BaseProductQuery {
  category?: 'COMPONENT' | 'SPARE';
  equipmentId?: string;
}

/**
 * Query params específicos para Materials
 * Backend acepta: page, limit, search (nombre/descripción), unitOfMeasureId, 
 * currencyId, isHazardous, isActive
 */
export interface MaterialQuery extends BaseProductQuery {
  unitOfMeasureId?: string;
  isHazardous?: boolean;
}

/**
 * Union type para cualquier tipo de query de producto
 */
export type ProductQuery = EquipmentQuery | SparePartQuery | MaterialQuery;
