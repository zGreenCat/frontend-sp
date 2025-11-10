export type ProductType = 'EQUIPO' | 'MATERIAL' | 'REPUESTO';
export type ProductStatus = 'ACTIVO' | 'INACTIVO';
export type Currency = 'CLP' | 'USD' | 'EUR';

export interface Product {
  id: string;
  sku: string;
  description: string;
  type: ProductType;
  status: ProductStatus;
  uom?: string;
  unitCost?: number;
  currency?: Currency;
  providerId?: string;
  projectId?: string;
  tenantId: string;
}
