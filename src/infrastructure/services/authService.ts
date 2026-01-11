import { apiClient } from "@/infrastructure/api/apiClient";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from "@/shared/types/auth.types";
import { mapBackendRoleToFrontend } from "@/shared/constants";
import { 
  setTokens, 
  clearAuth, 
  setUser as saveUserToStorage, 
  getUser as getUserFromStorage,
  hasTokens 
} from "@/lib/auth-storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not set");

export class AuthService {
  // ---------- Helpers de storage ----------

  getUser(): User | null {
    return getUserFromStorage<User>();
  }

  isAuthenticated(): boolean {
    return hasTokens() && !!this.getUser();
  }

  /**
   * Guardar autenticación completa (tokens + usuario)
   */
  private saveAuth(user: User, tokens: { accessToken: string; refreshToken?: string }) {
    setTokens(tokens);
    saveUserToStorage(user);
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

    const accessToken = response.accessToken || response.token || response.access_token;
    const refreshToken = response.refreshToken || response.refresh_token;
    const backendUser = response.user;

    if (!accessToken || !backendUser) {
      console.error("❌ Invalid register response:", Object.keys(response));
      throw new Error("Respuesta de registro inválida");
    }

    const user = this.mapBackendUserToFrontend(backendUser);

    // Guardar tokens + usuario
    this.saveAuth(user, { accessToken, refreshToken });

    return { token: accessToken, user };
  }

  // ---------- Flujo de login (email/password) ----------

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<any, LoginRequest>(
      "/auth/login",
      data,
      false
    );

    const accessToken = response.accessToken;
    const refreshToken = response.refreshToken;
    const backendUser = response.user;

    if (!accessToken) {
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
    console.log("✅ User login successful:", user.email);

    // Guardar tokens + usuario
    this.saveAuth(user, { accessToken, refreshToken });

    return { token: accessToken, user };
  }

  // ---------- Perfil actual (fuente de verdad) ----------

  async getProfile(): Promise<User> {
    console.log("═══════════════════════════════════════════════");
    console.log("🔐 GET PROFILE - Obteniendo usuario");
    console.log("═══════════════════════════════════════════════");

    try {
      // Usar Authorization header (apiClient lo manejará automáticamente)
      const response = await apiClient.get<any>("/users/me", true);

      const user = this.mapBackendUserToFrontend(response);

      // Guardar usuario actualizado (tokens ya están en storage)
      saveUserToStorage(user);

      return user;
    } catch (error) {
      console.error("❌ Error obteniendo perfil:", error);
      clearAuth();
      throw error;
    }
  }

  // ---------- Google OAuth - Intercambio de código ----------

  /**
   * Intercambia el código de autorización por tokens de acceso
   * Este método se llama desde /auth/success después del callback de Google
   */
  async exchangeCode(code: string): Promise<User> {
    console.log("═══════════════════════════════════════════════");
    console.log("🔄 EXCHANGE CODE - Intercambiando código por tokens");
    console.log("═══════════════════════════════════════════════");

    try {
      const response = await apiClient.post<any>(
        "/auth/exchange",
        { code },
        false
      );

      const accessToken = response.accessToken;
      const refreshToken = response.refreshToken;
      const backendUser = response.user;

      if (!accessToken) {
        console.error("❌ No accessToken in exchange response:", Object.keys(response));
        throw new Error("No se recibió token de acceso");
      }

      if (!backendUser) {
        console.error("❌ No user in exchange response:", Object.keys(response));
        throw new Error("No se recibió información del usuario");
      }

      const user = this.mapBackendUserToFrontend(backendUser);
      console.log("✅ Exchange successful for user:", user.email);

      // Guardar tokens + usuario
      this.saveAuth(user, { accessToken, refreshToken });

      return user;
    } catch (error) {
      console.error("❌ Error en exchangeCode:", error);
      clearAuth();
      throw error;
    }
  }

  // ---------- Google OAuth - Inicio de flujo ----------

  loginWithGoogle(): void {
    window.location.href = `${API_URL}/auth/google`;
  }

  // ---------- Logout ----------

  async logout(): Promise<void> {
    console.log("👋 Cerrando sesión...");

    try {
      // Llamar al backend para invalidar el token (opcional)
      await apiClient.post("/auth/logout", {}, true);
      console.log("✅ Token invalidado en el backend");
    } catch (error) {
      console.error("⚠️ Error al invalidar token en backend:", error);
    } finally {
      // Siempre limpiar storage local
      clearAuth();
      console.log("✅ Tokens y usuario limpiados del localStorage");
    }
  }
}

export const authService = new AuthService();
