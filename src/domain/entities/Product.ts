// Tipo de producto unificado (backend usa estos valores en inglés)
export type ProductKind = 'EQUIPMENT' | 'MATERIAL' | 'SPARE_PART';

// Alias para compatibilidad con código existente
export type ProductType = ProductKind;

export type ProductStatus = 'ACTIVO' | 'INACTIVO';
export type Currency = 'CLP' | 'USD' | 'EUR';

/**
 * Entidad unificada de Producto
 * Representa equipos, materiales y repuestos del catálogo
 */
export interface Product {
  id: string;
  kind: ProductKind; // Tipo de producto: EQUIPMENT, MATERIAL, SPARE_PART
  name: string;
  description?: string;

  // Campos específicos de Equipment y SparePart
  model?: string;

  // Campos específicos de Material
  unitOfMeasure?: string; // 'KG' | 'LT' | 'UNIT' | etc.
  isHazardous?: boolean;

  // Campos monetarios (NO parseamos el decimal, guardamos crudo)
  currency?: string; // Código de moneda (CLP, USD, EUR)
  currencySymbol?: string; // Símbolo de moneda ($, USD, €)
  monetaryValueRaw?: unknown; // Formato crudo del backend { s, e, d } (legacy)
  price?: number; // Precio como número (nueva estructura del backend)

  // Estado y auditoría
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Campos adicionales de negocio (compatibilidad con código existente)
  sku?: string; // Opcional, algunos productos pueden no tener SKU
  status?: ProductStatus; // Mapeo de isActive a ACTIVO/INACTIVO
  categories?: (string | { id?: string; categoryId?: string; name?: string })[];
  monetaryValue?: number; // Deprecated: usar monetaryValueRaw
  providerId?: string;
  projectId?: string;
  tenantId?: string;
}
