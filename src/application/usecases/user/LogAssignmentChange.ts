import { IAssignmentHistoryRepository } from '@/domain/repositories/IAssignmentHistoryRepository';
import { IAreaRepository } from '@/domain/repositories/IAreaRepository';
import { IWarehouseRepository } from '@/domain/repositories/IWarehouseRepository';
import { AssignmentAction, AssignmentType } from '@/domain/entities/AssignmentHistory';

export class LogAssignmentChange {
  constructor(
    private assignmentHistoryRepo: IAssignmentHistoryRepository,
    private areaRepo: IAreaRepository,
    private warehouseRepo: IWarehouseRepository
  ) {}

  async execute(params: {
    userId: string;
    previousAreas: string[];
    newAreas: string[];
    previousWarehouses: string[];
    newWarehouses: string[];
    performedBy: string;
    performedByName: string;
    tenantId: string;
  }): Promise<void> {
    const {
      userId,
      previousAreas,
      newAreas,
      previousWarehouses,
      newWarehouses,
      performedBy,
      performedByName,
      tenantId,
    } = params;

    const timestamp = new Date();

    // Detectar áreas agregadas
    const addedAreas = newAreas.filter(id => !previousAreas.includes(id));
    for (const areaId of addedAreas) {
      const area = await this.areaRepo.findById(areaId, tenantId);
      await this.assignmentHistoryRepo.create({
        userId,
        entityId: areaId,
        entityName: area?.name || areaId,
        entityType: 'AREA' as AssignmentType,
        action: 'ASSIGNED' as AssignmentAction,
        performedBy,
        performedByName,
        timestamp,
        tenantId,
      });
    }

    // Detectar áreas removidas
    const removedAreas = previousAreas.filter(id => !newAreas.includes(id));
    for (const areaId of removedAreas) {
      const area = await this.areaRepo.findById(areaId, tenantId);
      await this.assignmentHistoryRepo.create({
        userId,
        entityId: areaId,
        entityName: area?.name || areaId,
        entityType: 'AREA' as AssignmentType,
        action: 'REMOVED' as AssignmentAction,
        performedBy,
        performedByName,
        timestamp,
        tenantId,
      });
    }

    // Detectar bodegas agregadas
    const addedWarehouses = newWarehouses.filter(id => !previousWarehouses.includes(id));
    for (const warehouseId of addedWarehouses) {
      const warehouse = await this.warehouseRepo.findById(warehouseId, tenantId);
      await this.assignmentHistoryRepo.create({
        userId,
        entityId: warehouseId,
        entityName: warehouse?.name || warehouseId,
        entityType: 'WAREHOUSE' as AssignmentType,
        action: 'ASSIGNED' as AssignmentAction,
        performedBy,
        performedByName,
        timestamp,
        tenantId,
      });
    }

    // Detectar bodegas removidas
    const removedWarehouses = previousWarehouses.filter(id => !newWarehouses.includes(id));
    for (const warehouseId of removedWarehouses) {
      const warehouse = await this.warehouseRepo.findById(warehouseId, tenantId);
      await this.assignmentHistoryRepo.create({
        userId,
        entityId: warehouseId,
        entityName: warehouse?.name || warehouseId,
        entityType: 'WAREHOUSE' as AssignmentType,
        action: 'REMOVED' as AssignmentAction,
        performedBy,
        performedByName,
        timestamp,
        tenantId,
      });
    }
  }
}
