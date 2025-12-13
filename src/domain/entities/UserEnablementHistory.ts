// src/domain/entities/UserEnablementHistory.ts

export type EnablementAction = 'ENABLED' | 'DISABLED';

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface UserEnablementHistoryEntry {
  id: string;
  userId: string;
  action: EnablementAction;
  performedById: string;
  reason: string | null;
  occurredAt: Date;
  user?: UserInfo;
  performer?: UserInfo;
}

export interface UserEnablementHistoryResponse {
  data: UserEnablementHistoryEntry[];
  page: number;
  limit: number | null;
  total: number;
}
