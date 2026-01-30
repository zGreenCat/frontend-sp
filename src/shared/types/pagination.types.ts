/**
 * Respuesta paginada genérica para listas de entidades
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

/**
 * Parámetros de paginación estándar
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}
