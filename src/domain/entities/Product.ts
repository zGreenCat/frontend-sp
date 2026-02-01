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

  // Campos de dimensiones (solo para EQUIPMENT)
  weightValue?: number;
  weightUnitId?: string;
  widthValue?: number;
  widthUnitId?: string;
  heightValue?: number;
  heightUnitId?: string;
  lengthValue?: number;
  lengthUnitId?: string;

  // Campos específicos de Material
  unitOfMeasure?: string; // 'KG' | 'LT' | 'UNIT' | etc. (código de unidad)
  unitOfMeasureId?: string; // UUID de la unidad de medida
  isHazardous?: boolean;

  // Campos monetarios (NO parseamos el decimal, guardamos crudo)
  currency?: string; // Código de moneda (CLP, USD, EUR)
  currencyId?: string; // UUID de la moneda
  currencySymbol?: string; // Símbolo de moneda ($, USD, €)
  monetaryValueRaw?: unknown; // Formato crudo del backend { s, e, d } (legacy)
  monetaryValue?: string; // Valor monetario como string "10.50"
  price?: number; // Precio como número (nueva estructura del backend)

  // Estado y auditoría
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Campos adicionales de negocio (compatibilidad con código existente)
  sku?: string; // Opcional, algunos productos pueden no tener SKU (generado por backend)
  status?: ProductStatus; // Mapeo de isActive a ACTIVO/INACTIVO
  categories?: (string | { id?: string; categoryId?: string; name?: string })[];
  categoryIds?: string[]; // UUIDs de categorías
  providerId?: string;
  projectId?: string;
  tenantId?: string;
}
