// src/application/usecases/user/ValidateUserUnique.ts
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import {
  ValidateUserUniqueInput,
  ValidateUserUniqueResult,
} from "@/domain/entities/User";
import { Result } from "@/shared/types/Result"; // o donde tengas Result

export class ValidateUserUnique {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(
    input: ValidateUserUniqueInput
  ): Promise<Result<ValidateUserUniqueResult>> {
    try {
      const result = await this.userRepo.validateUnique(input);
      return { ok: true, value: result };
    } catch (err: any) {
      console.error("Error en ValidateUserUnique:", err);
      return { ok: false, error: err?.message || "Error al validar unicidad de usuario" };
    }
  }
}
