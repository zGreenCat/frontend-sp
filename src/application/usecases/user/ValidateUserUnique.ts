// src/application/usecases/user/ValidateUserUnique.ts
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import {
  ValidateUserUniqueInput,
  ValidateUserUniqueResult,
} from "@/domain/entities/User";
import { Result } from "@/shared/types/Result"; // o donde tengas Result

function normalizeRut(rawRut: string): string {
  const clean = rawRut.replace(/[^\dkK]/g, "").toUpperCase();

  if (clean.length <= 1) return clean;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return `${body}-${dv}`;
}

export class ValidateUserUnique {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(
    input: ValidateUserUniqueInput
  ): Promise<Result<ValidateUserUniqueResult>> {
    try {
      const normalizedInput = {
        ...input,
        rut: input.rut ? normalizeRut(input.rut) : undefined,
      };
      const result = await this.userRepo.validateUnique(normalizedInput);
      return { ok: true, value: result };
    } catch (err: any) {
      console.error("Error en ValidateUserUnique:", err);
      return { ok: false, error: err?.message || "Error al validar unicidad de usuario" };
    }
  }
}
