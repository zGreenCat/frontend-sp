import { apiClient } from "@/infrastructure/api/apiClient";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from "@/shared/types/auth.types";
import { mapBackendRoleToFrontend } from "@/shared/constants";

const USER_KEY = "auth_user"; // 🔑 usa una sola key consistente
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export class AuthService {
  // ---------- Helpers de storage ----------

   private saveUser(user: User) {
    if (typeof window === "undefined") return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clearUser() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("token"); // por si en algún flujo lo usas
  }

  getUser(): User | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getUser();
  }

  /**
   * Guardar auth localmente.
   * Para login tradicional puedes guardar token,
   * para Google OAuth puedes pasar `null` en token y solo guardas el user.
   */
  private saveAuth(user: User, token?: string | null) {
    this.saveUser(user);
    if (typeof window === "undefined") return;

    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  // ---------- Normalizadores de backend -> frontend ----------

  private normalizeAreas(areas: any): Array<{ id: string; name: string }> {
    if (!areas || !Array.isArray(areas)) return [];

    return areas
      .map((item) => {
        // Asignación con `area`
        if (item.area && typeof item.area === "object") {
          return {
            id: item.area.id || item.areaId,
            name: item.area.name || item.area.id,
          };
        }
        // Objeto { id, name }
        if (typeof item === "object" && item.id && item.name) {
          return { id: item.id, name: item.name };
        }
        // String (solo id)
        if (typeof item === "string") {
          return { id: item, name: item };
        }
        // Objeto con areaId
        if (item.areaId) {
          return { id: item.areaId, name: item.name || item.areaId };
        }
        return null;
      })
      .filter(Boolean) as Array<{ id: string; name: string }>;
  }

  private normalizeWarehouses(
    warehouses: any
  ): Array<{ id: string; name: string }> {
    if (!warehouses || !Array.isArray(warehouses)) return [];

    return warehouses
      .map((item) => {
        // Asignación con `warehouse`
        if (item.warehouse && typeof item.warehouse === "object") {
          return {
            id: item.warehouse.id || item.warehouseId,
            name: item.warehouse.name || item.warehouse.id,
          };
        }
        // Objeto { id, name }
        if (typeof item === "object" && item.id && item.name) {
          return { id: item.id, name: item.name };
        }
        // String (solo id)
        if (typeof item === "string") {
          return { id: item, name: item };
        }
        // Objeto con warehouseId
        if (item.warehouseId) {
          return { id: item.warehouseId, name: item.name || item.warehouseId };
        }
        return null;
      })
      .filter(Boolean) as Array<{ id: string; name: string }>;
  }

  private mapBackendUserToFrontend(backendUser: any): User {
    const roleObject = backendUser.role
      ? {
          id: backendUser.role.id || backendUser.roleId,
          name: mapBackendRoleToFrontend(
            backendUser.role.name || backendUser.role
          ),
          description: backendUser.role.description || null,
        }
      : undefined;

    return {
      ...backendUser,
      name: backendUser.firstName || backendUser.name || null,
      lastName: backendUser.lastName || "",
      role: roleObject,
      areas: this.normalizeAreas(
        backendUser.areaAssignments || backendUser.areas
      ),
      warehouses: this.normalizeWarehouses(
        backendUser.warehouseAssignments || backendUser.warehouses
      ),
    };
  }

  // ---------- Flujo de registro ----------

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<any, RegisterRequest>(
      "/auth/register",
      data,
      false
    );

    const token =
      response.token || response.access_token || response.accessToken;
    const backendUser = response.user;

    if (!token || !backendUser) {
      console.error("❌ Invalid register response:", Object.keys(response));
      throw new Error("Respuesta de registro inválida");
    }

    const user = this.mapBackendUserToFrontend(backendUser);

    // Guardar user + token (si lo usas para login tradicional)
    this.saveAuth(user, token);

    return { token, user };
  }

  // ---------- Flujo de login (email/password) ----------

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<any, LoginRequest>(
      "/auth/login",
      data,
      false
    );

    const token = response.accessToken;
    const backendUser = response.user;

    if (!token) {
      console.error("❌ No token found in response:", Object.keys(response));
      throw new Error("No se recibió token de autenticación");
    }

    if (!backendUser) {
      console.error("❌ No user found in response:", Object.keys(response));
      throw new Error("No se recibió información del usuario");
    }

    if (backendUser.isEnabled === false) {
      console.warn("⚠️ User account is disabled:", backendUser.email);
      throw new Error(
        "Tu cuenta se encuentra deshabilitada. Contacta con el Administrador o Jefatura"
      );
    }

    const user = this.mapBackendUserToFrontend(backendUser);
    console.log("✅ User response:", response);
    console.log("🔍 Mapped user areas:", user.areas);

    // Guardar user + token
    this.saveAuth(user, token);

    return { token, user };
  }

  // ---------- Perfil actual (fuente de verdad) ----------

  async getProfile(): Promise<User> {
    console.log("═══════════════════════════════════════════════");
    console.log("🔐 GET PROFILE - Obteniendo usuario");
    console.log("═══════════════════════════════════════════════");

    try {
      // Usa cookie httpOnly (credentials: 'include' ya lo maneja apiClient)
      const response = await apiClient.get<any>("/users/me", true);

      const user = this.mapBackendUserToFrontend(response);

      console.log("✅ Usuario autenticado correctamente");
      console.log(`👤 Email: ${user.email}`);
      console.log(`🔰 Rol: ${user.role && (user.role as any).name}`);
      console.log(`📋 Áreas: ${user.areas?.length || 0}`);
      console.log(`🏪 Bodegas: ${user.warehouses?.length || 0}`);

      // Guardar solo usuario; el token ya viene por cookie
      this.saveUser(user);

      return user;
    } catch (error) {
      console.error("❌ Error obteniendo perfil:", error);
      this.clearUser();
      throw error;
    }
  }

  // ---------- Google OAuth ----------

  loginWithGoogle(): void {
    console.log("🔑 Iniciando flujo de Google OAuth...");
    console.log(`📍 Redirigiendo a: ${API_URL}/auth/google`);
    window.location.href = `${API_URL}/auth/google`;
  }

  // ---------- Logout ----------

  async logout(): Promise<void> {
    console.log("🚪 LOGOUT - Limpiando sesión");

    try {
      // Primero llamar al backend para limpiar cookie httpOnly
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      console.log("✅ Cookie httpOnly limpiada en el backend");
    } catch (error) {
      console.error("⚠️ Error al limpiar cookie en backend:", error);
    } finally {
      // Siempre limpiar storage local, incluso si el backend falla
      if (typeof window !== "undefined") {
        this.clearUser(); // Limpia USER_KEY y token
        sessionStorage.clear();
        console.log("✅ localStorage y sessionStorage completamente limpiados");
      }
    }
  }
}

export const authService = new AuthService();
