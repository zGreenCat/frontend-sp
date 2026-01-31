import { IUnitOfMeasureRepository } from '@/domain/repositories/IUnitOfMeasureRepository';
import { UnitOfMeasure } from '@/domain/entities/UnitOfMeasure';
import { apiClient } from '@/infrastructure/api/apiClient';

interface BackendUnitOfMeasure {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  description: string | null;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UnitsOfMeasureResponse {
  data: BackendUnitOfMeasure[];
  total: number;
}

export class ApiUnitOfMeasureRepository implements IUnitOfMeasureRepository {
  async findAll(): Promise<UnitOfMeasure[]> {
    const response = await apiClient.get<UnitsOfMeasureResponse>('/units-of-measure');

    return response.data
      .filter((u: BackendUnitOfMeasure) => u.isActive)
      .map(this.mapBackendToDomain);
  }

  private mapBackendToDomain(u: BackendUnitOfMeasure): UnitOfMeasure {
    return {
      id: u.id,
      code: u.code,
      name: u.name,
      abbreviation: u.abbreviation,
      description: u.description,
      type: u.type,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  }
}
