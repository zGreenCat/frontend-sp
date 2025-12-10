// src/application/usecases/user/CreateUser.ts
import { User } from "@/domain/entities/User";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { IAssignmentRepository } from "@/domain/repositories/IAssignmentRepository";
import type { Result } from "@/shared/types/Result";
import { USER_ROLES } from "@/shared/constants";

export interface CreateUserWithAssignmentsInput {
  name: string;
  lastName: string;
  email: string;
  rut: string;
  phone?: string | null;
  role: string;        // 'ADMIN' | 'JEFE' | 'SUPERVISOR'
  tenantId: string;
  areas?: string[];      // opcional, para JEFE
  warehouses?: string[]; // opcional, para SUPERVISOR
}

export class CreateUser {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly assignmentRepo: IAssignmentRepository
  ) {}

  async execute(input: CreateUserWithAssignmentsInput): Promise<Result<User>> {
    try {
      // 1) Crear el usuario SIN asignaciones (solo datos “planos”)
      const userToCreate: Omit<User, "id"> = {
        name: input.name,
        lastName: input.lastName,
        email: input.email,
        rut: input.rut,
        phone: input.phone ?? "",
        role: input.role as any,          // si el tipo de role en User es más estricto, castear
        status: "HABILITADO",
        tenantId: input.tenantId,
        areas: [],        // las asignaciones se manejan por Assignment
        warehouses: [],
        // si tu entidad User tiene más props obligatorias, agrégalas aquí
      };

      const createdUser = await this.userRepo.create(userToCreate);

      // 2) Asignaciones opcionales según el rol de dominio
      const isJefe = createdUser.role === USER_ROLES.JEFE;
      const isSupervisor = createdUser.role === USER_ROLES.SUPERVISOR;

      // JEFE → asignar a áreas
      if (isJefe && input.areas && input.areas.length > 0) {
        for (const areaId of input.areas) {
          await this.assignmentRepo.assignManagerToArea(areaId, createdUser.id);
        }
      }

      // SUPERVISOR → asignar a bodegas
      if (isSupervisor && input.warehouses && input.warehouses.length > 0) {
        for (const warehouseId of input.warehouses) {
          await this.assignmentRepo.assignSupervisorToWarehouse(
            warehouseId,
            createdUser.id
          );
        }
      }

      // 3) Devolver el Result correcto
      const result: Result<User> = {
        ok: true,
        value: createdUser,
      };
      return result;
    } catch (err: any) {
      console.error("Error en CreateUser:", err);

      const result: Result<User> = {
        ok: false,
        error: err?.message || "Error al crear usuario",
      };
      return result;
    }
  }
}
