export type BoxStatus = 'ACTIVO' | 'INACTIVO' | 'EN_USO';
export type BoxType = 'ESTANDAR' | 'ESPECIAL' | 'REFRIGERADO';
export type Currency = 'CLP' | 'USD' | 'EUR';

export interface HistoryEvent {
  id: string;
  timestampISO: string;
  userId: string;
  eventType: string;
  before?: any;
  after?: any;
}

export interface Box {
  id: string;
  code: string;
  type: BoxType;
  status: BoxStatus;
  unitCost: number;
  currency: Currency;
  history: HistoryEvent[];
  tenantId: string;
}
