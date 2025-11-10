export type ProviderStatus = 'ACTIVO' | 'INACTIVO';

export interface Provider {
  id: string;
  name: string;
  status: ProviderStatus;
  productsCount: number;
  tenantId: string;
}
