// application/usecases/user/ToggleUserStatus.ts
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { Result } from "@/shared/types/Result";
import { User } from "@/domain/entities/User";

export class ToggleUserStatus {
  constructor(
    private userRepo: IUserRepository
  ) {}

  async execute(params: {
    targetUserId: string;
    newStatus: "HABILITADO" | "DESHABILITADO";
    performedBy: string; // ID del usuario que realiza el cambio
    tenantId: string;
    reason?: string; // Razón del cambio de estado
  }): Promise<Result<User>> {
    try {
      // Actualizar el estado del usuario
      // El backend registra automáticamente en UserEnablementHistory
      const updated = await this.userRepo.update(
        params.targetUserId,
        {
          status: params.newStatus,
          reason: params.reason,
        },
        params.tenantId
      );

      return { ok: true, value: updated };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || "Error al cambiar estado del usuario",
      };
    }
  }
}

