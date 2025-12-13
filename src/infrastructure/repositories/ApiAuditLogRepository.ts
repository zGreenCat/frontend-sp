// src/infrastructure/repositories/ApiAuditLogRepository.ts

import { apiClient } from '../api/apiClient';
import { IAuditLogRepository } from '@/domain/repositories/IAuditLogRepository';
import { AuditLogEntry, CreateAuditLogInput } from '@/domain/entities/AuditLog';

export class ApiAuditLogRepository implements IAuditLogRepository {
  async create(input: CreateAuditLogInput): Promise<AuditLogEntry> {
    try {
      const response = await apiClient.post<any>('/audit-logs', input, true);
      return this.mapToAuditLogEntry(response);
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    tenantId: string
  ): Promise<AuditLogEntry[]> {
    try {
      const response = await apiClient.get<any[]>(
        `/audit-logs?entityType=${entityType}&entityId=${entityId}`,
        true
      );
      return (response || []).map(this.mapToAuditLogEntry);
    } catch (error) {
      console.error('Error fetching audit logs by entity:', error);
      return [];
    }
  }

  async findAll(
    tenantId: string,
    limit?: number,
    offset?: number
  ): Promise<AuditLogEntry[]> {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());

      const response = await apiClient.get<any[]>(
        `/audit-logs?${params.toString()}`,
        true
      );
      return (response || []).map(this.mapToAuditLogEntry);
    } catch (error) {
      console.error('Error fetching all audit logs:', error);
      return [];
    }
  }

  async findByPerformer(
    performedBy: string,
    tenantId: string
  ): Promise<AuditLogEntry[]> {
    try {
      const response = await apiClient.get<any[]>(
        `/audit-logs?performedBy=${performedBy}`,
        true
      );
      return (response || []).map(this.mapToAuditLogEntry);
    } catch (error) {
      console.error('Error fetching audit logs by performer:', error);
      return [];
    }
  }

  private mapToAuditLogEntry(data: any): AuditLogEntry {
    return {
      id: data.id,
      entityType: data.entityType,
      entityId: data.entityId,
      entityName: data.entityName,
      action: data.action,
      performedBy: data.performedBy,
      performedByName: data.performedByName,
      performedAt: new Date(data.performedAt || data.createdAt),
      details: data.details,
      tenantId: data.tenantId,
    };
  }
}
