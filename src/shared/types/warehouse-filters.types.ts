/**
 * Types for Warehouse filtering and query parameters
 * Matches backend GET /warehouses query params
 */

export type WarehouseOrder = "asc" | "desc";
export type WarehouseSortBy = "name" | "createdAt" | "maxCapacityKg";

export interface WarehouseQuery {
  page: number;
  limit?: number;
  search?: string;
  isEnabled?: boolean;
  sortBy?: WarehouseSortBy;
  order?: WarehouseOrder;
}
