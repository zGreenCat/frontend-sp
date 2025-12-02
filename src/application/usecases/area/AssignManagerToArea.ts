import { IAreaRepository } from '@/domain/repositories/IAreaRepository';
import { Result } from '@/shared/types';

export class AssignManagerToArea {
  constructor(private areaRepo: IAreaRepository) {}

  async execute(areaId: string, managerId: string): Promise<Result<void>> {
    try {
      await (this.areaRepo as any).assignManager(areaId, managerId);
      
      return {
        ok: true,
        value: undefined,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Error al asignar jefe de área',
      };
    }
  }
}
