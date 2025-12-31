// Box Status según backend
export type BoxStatus = 'ACTIVA' | 'INACTIVA' | 'EN_USO';

// Box Type según backend (PEQUEÑA, NORMAL, GRANDE)
export type BoxType = 'PEQUEÑA' | 'NORMAL' | 'GRANDE';

// History Event Types según backend
export type HistoryEventType = 'CREATED' | 'UPDATED' | 'MOVED' | 'STATUS_CHANGED' | 'DEACTIVATED';

export interface HistoryEvent {
  id: string;
  boxId: string;
  eventType: HistoryEventType;
  timestamp: string; // ISO 8601
  userId: string;
  description?: string;
  metadata?: Record<string, any>; // Datos adicionales del evento
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  capacityKg: number;
}

export interface Box {
  id: string;
  qrCode: string; // Identificador único, NO modificable
  description?: string;
  type: BoxType;
  currentWeightKg: number; // Peso/contenido actual
  status: BoxStatus;
  warehouseId: string; // Bodega actual
  warehouse?: Warehouse; // Información de la bodega (si viene en el detalle)
  history?: HistoryEvent[]; // Historial de eventos
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}
