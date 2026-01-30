import { ProductKind } from './Product';

/**
 * Tipos de eventos de historial de productos
 * Basado en los eventos típicos del ciclo de vida de un producto
 */
export type ProductHistoryEventType =
  | 'CREATED'          // Producto creado
  | 'UPDATED'          // Actualización general
  | 'DEACTIVATED'      // Dado de baja (isActive: false)
  | 'REACTIVATED'      // Reactivado (isActive: true)
  | 'PRICE_CHANGED'    // Cambio de precio/costo
  | 'UNIT_CHANGED'     // Cambio de unidad de medida
  | 'MODEL_CHANGED'    // Cambio de modelo (equipos/repuestos)
  | 'DESCRIPTION_CHANGED' // Cambio de descripción
  | 'CURRENCY_CHANGED' // Cambio de moneda
  | 'OTHER';           // Otros cambios

/**
 * Representa un evento en el historial de un producto
 * Registra cambios realizados en el catálogo de productos
 * 
 * Nota: Actualmente el backend no expone endpoints de historial de productos.
 * Esta estructura está preparada para cuando se implemente.
 */
export interface ProductHistoryEvent {
  id: string;
  productId: string;
  kind: ProductKind; // EQUIPMENT, MATERIAL, SPARE_PART
  eventType: ProductHistoryEventType;
  
  // Usuario que realizó la acción
  performedBy: {
    id: string;
    name: string;
    email: string;
  } | null; // null si fue una acción del sistema
  
  // Timestamp del evento
  performedAt: string; // ISO 8601 date string
  
  // Valores antes y después del cambio
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  
  // Justificación del cambio (opcional)
  justification?: string | null;
  
  // Metadatos adicionales
  metadata?: Record<string, unknown> | null;
}

/**
 * Parámetros para filtrar historial de productos
 */
export interface ProductHistoryFilters {
  page?: number;
  limit?: number;
  from?: string; // Fecha desde (ISO)
  to?: string;   // Fecha hasta (ISO)
  eventType?: ProductHistoryEventType;
  performedBy?: string; // ID del usuario
}
