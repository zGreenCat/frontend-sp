import { IAreaRepository } from '@/domain/repositories/IAreaRepository';
import { Area } from '@/domain/entities/Area';
import { Result } from '@/shared/types';

export interface AreaDetail {
  area: Area;
  managers: Array<{ id: string; name: string; email: string; assignmentId?: string }>;
  warehouses: Array<{ id: string; name: string }>;
}

export class GetAreaDetail {
  constructor(private areaRepo: IAreaRepository) {}

  async execute(areaId: string): Promise<Result<AreaDetail>> {
    try {
      const result = await (this.areaRepo as any).findByIdWithDetails(areaId);
      
      if (!result) {
        return {
          ok: false,
          error: 'Área no encontrada',
        };
      }

      return {
        ok: true,
        value: result,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Error al obtener detalle del área',
      };
    }
  }
}
