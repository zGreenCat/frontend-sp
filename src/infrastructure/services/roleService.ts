// src/infrastructure/services/roleService.ts
import { apiClient } from "@/infrastructure/api/apiClient";

interface Role {
  id: string;
  name: string;
  description?: string;
}

class RoleService {
  private roles: Role[] | null = null;

  // Carga los roles si aún no están cargados
  async ensureRoles(force: boolean = false): Promise<Role[]> {
    // Si ya tenemos roles y no queremos forzar, devolvemos cache
    if (this.roles && this.roles.length > 0 && !force) {
      return this.roles;
    }

    // En SSR no hacemos nada
    if (typeof window === "undefined") {
      return this.roles ?? [];
    }

    try {
      console.log("🔄 Loading roles from API...");
      const res = await apiClient.get<any>("/roles", true);

      const roles: Role[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.roles)
        ? res.roles
        : [];

      this.roles = roles;
      console.log(
        `✅ Loaded ${roles.length} roles:`,
        roles.map((r) => r.name).join(", ")
      );
      return roles;
    } catch (err) {
      console.error("❌ Error loading roles:", err);
      this.roles = [];
      return [];
    }
  }

  getAllRoles(): Role[] {
    return this.roles ?? [];
  }

  findByName(name: string): Role | undefined {
    return (this.roles ?? []).find((r) => r.name === name);
  }

  clear(): void {
    this.roles = null;
  }
}

export const roleService = new RoleService();
