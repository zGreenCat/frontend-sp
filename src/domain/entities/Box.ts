import { BoxEquipment } from './BoxEquipment';
import { BoxMaterial } from './BoxMaterial';

// Box Status según backend real
export type BoxStatus = 'DISPONIBLE' | 'EN_REPARACION' | 'DANADA' | 'RETIRADA';

// Box Type según backend (PEQUEÑA, NORMAL, GRANDE)
export type BoxType = 'PEQUEÑA' | 'NORMAL' | 'GRANDE';

// History Event Types según backend
export type HistoryEventType = 'CREATED' | 'UPDATED' | 'MOVED' | 'STATUS_CHANGED' | 'DEACTIVATED' | 'INVENTORY_ADDED' | 'INVENTORY_REMOVED';

export interface PerformedBy {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface HistoryEvent {
  id: string;
  boxId: string;
  eventType: HistoryEventType;
  reason?: string;
  performedBy: PerformedBy;
  occurredAt: string; // ISO 8601
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
  warehouseId: string | null; // Bodega actual (puede ser null)
  warehouseName?: string | null; // Nombre de la bodega (viene del backend)
  warehouse?: Warehouse; // Información completa de la bodega (solo en detalle)
  equipments?: BoxEquipment[]; // Equipos asignados a la caja
  materials?: BoxMaterial[]; // Materiales asignados a la caja
  history?: HistoryEvent[]; // Historial de eventos
  tenantId: string;
  isActive: boolean; // Estado de activación
  createdAt: string;
  updatedAt: string;
}
