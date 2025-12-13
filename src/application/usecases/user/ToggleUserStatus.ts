// application/usecases/user/ToggleUserStatus.ts
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { IAuditLogRepository } from "@/domain/repositories/IAuditLogRepository";
import { Result } from "@/shared/types/Result";
import { User } from "@/domain/entities/User";

export class ToggleUserStatus {
  constructor(
    private userRepo: IUserRepository,
    private auditLogRepo?: IAuditLogRepository
  ) {}

  async execute(params: {
    targetUserId: string;
    newStatus: "HABILITADO" | "DESHABILITADO";
    performedBy: string; // ID del usuario que realiza el cambio
    tenantId: string;
  }): Promise<Result<User>> {
    try {
      // Actualizar el estado del usuario
      const updated = await this.userRepo.update(
        params.targetUserId,
        {
          status: params.newStatus,
        },
        params.tenantId
      );

      // Registrar en auditoría
      if (this.auditLogRepo) {
        try {
          await this.auditLogRepo.create({
            entityType: 'USER',
            entityId: params.targetUserId,
            entityName: `${updated.name} ${updated.lastName}`,
            action: params.newStatus === 'HABILITADO' ? 'USER_ENABLED' : 'USER_DISABLED',
            performedBy: params.performedBy,
            details: {
              previousStatus: params.newStatus === 'HABILITADO' ? 'DESHABILITADO' : 'HABILITADO',
              newStatus: params.newStatus,
            },
            tenantId: params.tenantId,
          });
          console.log(`✅ Auditoría registrada: Usuario ${params.newStatus}`);
        } catch (auditError) {
          // No fallar la operación principal si falla la auditoría
          console.error('⚠️ Error al registrar auditoría:', auditError);
        }
      }

      return { ok: true, value: updated };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || "Error al cambiar estado del usuario",
      };
    }
  }
}

