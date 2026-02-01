import { IMaterialCategoryRepository } from '@/domain/repositories/IMaterialCategoryRepository';
import { MaterialCategory } from '@/domain/entities/MaterialCategory';
import { PaginatedResponse } from '@/shared/types/pagination.types';
import { apiClient } from '@/infrastructure/api/apiClient';

interface BackendMaterialCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BackendPaginatedResponse {
  data: BackendMaterialCategory[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export class ApiMaterialCategoryRepository implements IMaterialCategoryRepository {
  
  async findAll(): Promise<MaterialCategory[]> {
    try {
      // Obtener todas las categorías activas (usar límite alto)
      const response = await apiClient.get<BackendPaginatedResponse>(
        '/material-categories?page=1&limit=100',
        true
      );

      // Filtrar solo las activas
      return (response.data || [])
        .filter(cat => cat.isActive)
        .map(this.mapToEntity);
    } catch (error) {
      console.error('[ApiMaterialCategoryRepository] Error fetching categories:', error);
      return [];
    }
  }

  async list(page = 1, limit = 20): Promise<PaginatedResponse<MaterialCategory>> {
    try {
      const response = await apiClient.get<BackendPaginatedResponse>(
        `/material-categories?page=${page}&limit=${limit}`,
        true
      );

      return {
        data: (response.data || []).map(this.mapToEntity),
        total: response.total || 0,
        page: response.page || page,
        limit: response.limit || limit,
        totalPages: response.totalPages || Math.ceil((response.total || 0) / limit),
      };
    } catch (error) {
      console.error('[ApiMaterialCategoryRepository] Error listing categories:', error);
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  private mapToEntity(backend: BackendMaterialCategory): MaterialCategory {
    return {
      id: backend.id,
      name: backend.name,
      description: backend.description,
      parentId: backend.parentId,
      isActive: backend.isActive,
      createdAt: backend.createdAt,
      updatedAt: backend.updatedAt,
    };
  }
}
