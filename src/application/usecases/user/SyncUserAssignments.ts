// application/usecases/users/SyncUserAssignments.ts
import { User } from '@/domain/entities/User';
import { IAssignmentRepository } from '@/domain/repositories/IAssignmentRepository';
import { USER_ROLES } from '@/shared/constants';

interface SyncUserAssignmentsInput {
  user: User;                    // usuario ya creado/actualizado
  role: User['role'];            // rol efectivo del usuario
  previousAreas?: string[];      // áreas que tenía ANTES
  previousWarehouses?: string[]; // bodegas que tenía ANTES
}

export class SyncUserAssignments {
  constructor(private assignmentsRepo: IAssignmentRepository) {}

  async execute({
    user,
    role,
    previousAreas = [],
    previousWarehouses = [],
  }: SyncUserAssignmentsInput): Promise<void> {
    const isJefe =
      role === 'JEFE_AREA' ||
      role === USER_ROLES.JEFE;

    const isSupervisor =
      role === 'SUPERVISOR' ||
      role === USER_ROLES.SUPERVISOR;

    // --- JEFE: asignaciones área <-> usuario ---
    if (isJefe) {
      const currentAreas = user.areas || [];

      const areasToAdd = currentAreas.filter(id => !previousAreas.includes(id));
      const areasToRemove = previousAreas.filter(id => !currentAreas.includes(id));

      for (const areaId of areasToAdd) {
        await this.assignmentsRepo.assignManagerToArea(areaId, user.id);
      }

      for (const areaId of areasToRemove) {
        await this.assignmentsRepo.removeManagerFromArea(areaId, user.id);
      }
    }

    // --- SUPERVISOR: asignaciones bodega <-> usuario ---
    if (isSupervisor) {
      const currentWarehouses = user.warehouses || [];

      const warehousesToAdd = currentWarehouses.filter(
        id => !previousWarehouses.includes(id),
      );
      const warehousesToRemove = previousWarehouses.filter(
        id => !currentWarehouses.includes(id),
      );

      for (const warehouseId of warehousesToAdd) {
        await this.assignmentsRepo.assignSupervisorToWarehouse(
          warehouseId,
          user.id,
        );
      }

      for (const warehouseId of warehousesToRemove) {
        await this.assignmentsRepo.removeSupervisorFromWarehouse(
          warehouseId,
          user.id,
        );
      }
    }
  }
}
