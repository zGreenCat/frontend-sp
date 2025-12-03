import { apiClient } from "@/infrastructure/api/apiClient";
import { roleService } from "@/infrastructure/services/roleService";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from "@/shared/types/auth.types";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export class AuthService {
  /**
   * Registrar un nuevo usuario
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<any, RegisterRequest>(
      "/auth/register",
      data,
      false
    );

    // El backend puede devolver diferentes estructuras
    const token = response.token || response.access_token || response.accessToken;
    const backendUser = response.user;

    if (!token || !backendUser) {
      console.error('❌ Invalid register response:', Object.keys(response));
      throw new Error('Respuesta de registro inválida');
    }

    // Mapear firstName del backend a name del frontend y normalizar areas/warehouses
    const user: User = {
      ...backendUser,
      name: backendUser.firstName || backendUser.name || null,
      lastName: backendUser.lastName || '',
      areas: this.normalizeAreas(backendUser.areas),
      warehouses: this.normalizeWarehouses(backendUser.warehouses),
    };

    // Guardar token y usuario en localStorage
    this.saveAuth(token, user);

    return { token, user };
  }

  /**
   * Iniciar sesión
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<any, LoginRequest>(
      "/auth/login",
      data,
      false
    );

    // El backend puede devolver diferentes estructuras:
    // Opción 1: { user, token }
    // Opción 2: { access_token, user }
    // Opción 3: { accessToken, user }
    const token = response.accessToken;
    const backendUser = response.user;

    if (!token) {
      console.error('❌ No token found in response:', Object.keys(response));
      throw new Error('No se recibió token de autenticación');
    }

    if (!backendUser) {
      console.error('❌ No user found in response:', Object.keys(response));
      throw new Error('No se recibió información del usuario');
    }

    // Validar que la cuenta esté habilitada
    if (backendUser.isEnabled === false) {
      console.warn('⚠️ User account is disabled:', backendUser.email);
      throw new Error('Tu cuenta se encuentra deshabilitada. Contacta con el Administrador o Jefatura');
    }

    // Mapear firstName del backend a name del frontend y normalizar areas/warehouses
    const user: User = {
      ...backendUser,
      name: backendUser.firstName || backendUser.name || null,
      lastName: backendUser.lastName || '',
      areas: this.normalizeAreas(backendUser.areaAssignments),
      warehouses: this.normalizeWarehouses(backendUser.warehouses),
    };
    console.log('✅ User response:', response); // DEBUG
    console.log('🔍 Mapped user areas:', user.areas);

    // Guardar token y usuario en localStorage
    this.saveAuth(token, user);

    return { token, user };
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<any>("/users/me", true);
    
    // Mapear firstName del backend a name del frontend y normalizar areas/warehouses
    const user: User = {
      ...response,
      name: response.firstName || response.name || null,
      lastName: response.lastName || '',
      areas: this.normalizeAreas(response.areas),
      warehouses: this.normalizeWarehouses(response.warehouses),
    };
    
    // Actualizar usuario en localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    return user;
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // Limpiar cache de roles
      roleService.clearCache();
    }
  }

  /**
   * Guardar autenticación en localStorage
   */
  private saveAuth(token: string, user: User): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  /**
   * Obtener token guardado
   */
  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  /**
   * Obtener usuario guardado
   */
  getUser(): User | null {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Normalizar áreas del backend a formato uniforme
   */
  private normalizeAreas(areas: any): Array<{ id: string; name: string }> {
    if (!areas || !Array.isArray(areas)) return [];
    return areas.map(item => {
      // Si ya es un objeto con id y name, retornarlo
      if (item.area && typeof item.area === 'object') {
        return { 
          id: item.area.id || item.areaId, 
          name: item.area.name || item.area.id 
        };
      }
      return null;
    }).filter(Boolean) as Array<{ id: string; name: string }>;
  }

  /**
   * Normalizar bodegas del backend a formato uniforme
   */
  private normalizeWarehouses(warehouses: any): Array<{ id: string; name: string }> {
    if (!warehouses || !Array.isArray(warehouses)) return [];
    
    return warehouses.map(warehouse => {
      // Si ya es un objeto con id y name, retornarlo
      if (typeof warehouse === 'object' && warehouse.id && warehouse.name) {
        return { id: warehouse.id, name: warehouse.name };
      }
      // Si es un string (solo ID), crear objeto básico
      if (typeof warehouse === 'string') {
        return { id: warehouse, name: warehouse };
      }
      // Si tiene warehouseId en lugar de id
      if (warehouse.warehouseId) {
        return { id: warehouse.warehouseId, name: warehouse.name || warehouse.warehouseId };
      }
      return warehouse;
    }).filter(Boolean);
  }
}

export const authService = new AuthService();
