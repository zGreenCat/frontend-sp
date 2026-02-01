import { MaterialCategory } from '../entities/MaterialCategory';
import { PaginatedResponse } from '@/shared/types/pagination.types';

export interface IMaterialCategoryRepository {
  /**
   * Lista todas las categorías de materiales activas
   */
  findAll(): Promise<MaterialCategory[]>;
  
  /**
   * Lista categorías con paginación
   */
  list(page?: number, limit?: number): Promise<PaginatedResponse<MaterialCategory>>;
}
