// application/usecases/users/UpdateUserWithAssignments.ts
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IAssignmentRepository } from '@/domain/repositories/IAssignmentRepository';
import { User } from '@/domain/entities/User';
import { SyncUserAssignments } from './SyncUserAssignments';

interface UpdateUserWithAssignmentsInput {
  id: string;
  tenantId: string;
  updates: Partial<User>; // incluye areas/warehouses opcionalmente
}

export class UpdateUserWithAssignments {
  constructor(
    private userRepo: IUserRepository,
    private assignmentsRepo: IAssignmentRepository,
  ) {}

  async execute({
    id,
    tenantId,
    updates,
  }: UpdateUserWithAssignmentsInput): Promise<User> {
    // 1. Obtener usuario actual para saber "antes"
    const existingUser = await this.userRepo.findById(id, tenantId);
    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }

    const previousAreas = existingUser.areas || [];
    const previousWarehouses = existingUser.warehouses || [];

    // 2. Separar lo que es datos del usuario de lo que son asignaciones
    const {
      areas = previousAreas,
      warehouses = previousWarehouses,
      // no queremos mandar estas al update del repo
      areaDetails,
      warehouseDetails,
      areaAssignments,
      ...userFields
    } = updates;

    // 3. Actualizar SOLO datos propios del usuario
    const updatedUser = await this.userRepo.update(id, userFields, tenantId);

    // 4. Sincronizar asignaciones en base al diff
    const syncAssignments = new SyncUserAssignments(this.assignmentsRepo);
    await syncAssignments.execute({
      user: { ...updatedUser, areas, warehouses },
      role: updatedUser.role,
      previousAreas,
      previousWarehouses,
    });

    // 5. Devolver usuario actualizado con arrays finales
    return {
      ...updatedUser,
      areas,
      warehouses,
    };
  }
}
