export type AssignmentAction = 'ASSIGNED' | 'REMOVED';
export type AssignmentType = 'AREA' | 'WAREHOUSE';

export interface AssignmentHistoryEntry {
  id: string;
  userId: string;
  entityId: string; // ID del área o bodega
  entityName: string; // Nombre del área o bodega para visualización
  entityType: AssignmentType;
  action: AssignmentAction;
  performedBy: string; // ID del usuario que realizó el cambio
  performedByName: string; // Nombre del usuario que realizó el cambio
  timestamp: Date;
  tenantId: string;
}

export interface AssignmentHistory {
  entries: AssignmentHistoryEntry[];
}
