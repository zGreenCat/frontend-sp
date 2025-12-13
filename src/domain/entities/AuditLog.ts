// src/domain/entities/AuditLog.ts

export type AuditAction =
  | 'USER_ENABLED'
  | 'USER_DISABLED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'AREA_CREATED'
  | 'AREA_UPDATED'
  | 'AREA_STATUS_CHANGED'
  | 'ASSIGNMENT_CREATED'
  | 'ASSIGNMENT_REVOKED';

export type AuditEntityType = 'USER' | 'AREA' | 'WAREHOUSE' | 'ASSIGNMENT';

export interface AuditLogEntry {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string; // Para mostrar en UI
  action: AuditAction;
  performedBy: string; // ID del usuario que realizó la acción
  performedByName?: string; // Nombre para mostrar en UI
  performedAt: Date;
  details?: Record<string, any>; // JSON con detalles adicionales
  tenantId: string;
}

export interface CreateAuditLogInput {
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  action: AuditAction;
  performedBy: string;
  details?: Record<string, any>;
  tenantId: string;
}
