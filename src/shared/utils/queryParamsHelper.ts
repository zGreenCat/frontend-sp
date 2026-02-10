/**
 * Helper para construir query params de productos
 * Omite valores undefined/null/"" para no ensuciar URLs
 */

import { ProductQuery } from '@/shared/types/product-filters.types';

/**
 * Construye URLSearchParams a partir de un objeto de filtros
 * Omite campos vacíos, undefined o null
 * Serializa booleans correctamente como "true"/"false"
 */
export function buildQueryParams(query: ProductQuery): URLSearchParams {
  const params = new URLSearchParams();

  // Iterar sobre cada propiedad del query
  Object.entries(query).forEach(([key, value]) => {
    // Omitir valores vacíos
    if (value === undefined || value === null || value === '') {
      return;
    }

    // Boolean: convertir a string "true"/"false"
    if (typeof value === 'boolean') {
      params.append(key, value.toString());
      return;
    }

    // Number: convertir a string
    if (typeof value === 'number') {
      params.append(key, value.toString());
      return;
    }

    // String: agregar directamente (ya validamos que no esté vacío)
    if (typeof value === 'string') {
      params.append(key, value);
      return;
    }
  });

  return params;
}

/**
 * Parsea query params de URL a objeto tipado
 * Útil para sincronizar estado con URL
 */
export function parseQueryParams(searchParams: URLSearchParams): Partial<ProductQuery> {
  const query: Partial<ProductQuery> = {};

  // Page y limit (números)
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');
  if (page) query.page = parseInt(page, 10);
  if (limit) query.limit = parseInt(limit, 10);

  // Search (string)
  const search = searchParams.get('search');
  if (search) query.search = search;

  // isActive (boolean)
  const isActive = searchParams.get('isActive');
  if (isActive !== null) query.isActive = isActive === 'true';

  // currencyId (UUID)
  const currencyId = searchParams.get('currencyId');
  if (currencyId) query.currencyId = currencyId;

  // category (enum) - solo para spare parts
  const category = searchParams.get('category');
  if (category && (category === 'COMPONENT' || category === 'SPARE')) {
    (query as any).category = category;
  }

  // equipmentId (UUID) - solo para spare parts
  const equipmentId = searchParams.get('equipmentId');
  if (equipmentId) (query as any).equipmentId = equipmentId;

  // unitOfMeasureId (UUID) - solo para materials
  const unitOfMeasureId = searchParams.get('unitOfMeasureId');
  if (unitOfMeasureId) (query as any).unitOfMeasureId = unitOfMeasureId;

  // isHazardous (boolean) - solo para materials
  const isHazardous = searchParams.get('isHazardous');
  if (isHazardous !== null) (query as any).isHazardous = isHazardous === 'true';

  return query;
}

/**
 * Crea un objeto de query con defaults
 */
export function createDefaultQuery(overrides?: Partial<ProductQuery>): ProductQuery {
  return {
    page: 1,
    limit: 10,
    ...overrides,
  } as ProductQuery;
}
