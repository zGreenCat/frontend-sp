/**
 * Types for Project filtering and query parameters
 * Matches backend GET /projects query params
 */

export type ProjectOrder = "asc" | "desc";
export type ProjectSortBy = "name" | "code" | "createdAt" | "status";

export interface ProjectQuery {
  page: number;
  limit?: number;
  search?: string;
  status?: string; // ACTIVO | INACTIVO | FINALIZADO
  sortBy?: ProjectSortBy;
  order?: ProjectOrder;
}
