export type AssignmentAction = 'ASSIGNED' | 'REMOVED';
export type AssignmentEntityType = 'AREA' | 'WAREHOUSE';

export interface AssignmentHistoryEntry {
  id: string;
  userId: string;
  entityId: string;
  entityName: string;
  entityType: AssignmentEntityType;
  action: AssignmentAction;
  performedById: string;
  performedByName: string;
  performedByEmail: string;
  timestamp: Date;
  revokedAt: Date | null;
  isActive: boolean;
}

export interface AssignmentHistoryResponse {
  data: AssignmentHistoryEntry[];
  total: number;
  page: number;
  limit: number | null;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
