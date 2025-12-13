// src/domain/repositories/IAuditLogRepository.ts

import { AuditLogEntry, CreateAuditLogInput } from '../entities/AuditLog';

export interface IAuditLogRepository {
  /**
   * Crea un nuevo registro de auditoría
   */
  create(input: CreateAuditLogInput): Promise<AuditLogEntry>;

  /**
   * Obtiene el historial de auditoría de una entidad específica
   */
  findByEntity(
    entityType: string,
    entityId: string,
    tenantId: string
  ): Promise<AuditLogEntry[]>;

  /**
   * Obtiene todos los logs de auditoría de un tenant (con paginación opcional)
   */
  findAll(
    tenantId: string,
    limit?: number,
    offset?: number
  ): Promise<AuditLogEntry[]>;

  /**
   * Obtiene los logs de auditoría realizados por un usuario específico
   */
  findByPerformer(
    performedBy: string,
    tenantId: string
  ): Promise<AuditLogEntry[]>;
}
