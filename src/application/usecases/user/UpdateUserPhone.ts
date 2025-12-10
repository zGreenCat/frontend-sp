// application/usecases/user/UpdateUserPhone.ts
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { Result } from "@/shared/types/Result";

export class UpdateUserPhone {
  constructor(private userRepo: IUserRepository) {}

  async execute(params: {
    userId: string;          // usuario a actualizar
    phone: string | null;    // nuevo teléfono
    tenantId: string;
  }): Promise<Result<import("@/domain/entities/User").User>> {
    try {
      const updated = await this.userRepo.update(params.userId, {
        phone: params.phone ?? undefined,
      }, params.tenantId);

      return { ok: true, value: updated };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || "Error al actualizar teléfono",
      };
    }
  }
}
