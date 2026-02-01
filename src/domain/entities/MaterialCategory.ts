export interface MaterialCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
