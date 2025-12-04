import { apiClient } from "@/infrastructure/api/apiClient";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from "@/shared/types/auth.types";

const USER_KEY = "user";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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
   * 🔐 MÉTODO PRINCIPAL: Obtener perfil del usuario actual
   * 
   * Para login tradicional (email/password):
   * - Usa el token de localStorage con Authorization header
   * 
   * Para login con Google OAuth:
   * - Usa la cookie httpOnly que el backend estableció
   * - El navegador envía la cookie automáticamente con credentials: 'include'
   */
  async getProfile(): Promise<User> {
    console.log('═══════════════════════════════════════════════');
    console.log('🔐 GET PROFILE - Obteniendo usuario');
    console.log('═══════════════════════════════════════════════');
    
    try {
      // Llamar a /users/me - Si hay token usa Authorization header, si no usa cookie
      const response = await apiClient.get<any>("/users/me", true);
      
      // Mapear firstName del backend a name del frontend y normalizar areas/warehouses
      const user: User = {
        ...response,
        name: response.firstName || response.name || null,
        lastName: response.lastName || '',
        areas: this.normalizeAreas(response.areaAssignments || response.areas),
        warehouses: this.normalizeWarehouses(response.warehouseAssignments || response.warehouses),
      };
      
      console.log('✅ Usuario autenticado correctamente');
      console.log(`👤 Email: ${user.email}`);
      console.log(`📋 Áreas: ${user.areas?.length || 0}`);
      console.log(`🏪 Bodegas: ${user.warehouses?.length || 0}`);
      
      // Guardar usuario en localStorage (NO el token)
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        console.log('💾 Usuario guardado en localStorage');
      }
      
      return user;
      
    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error);
      if (typeof window !== "undefined") {
        localStorage.removeItem(USER_KEY);
      }
      throw error;
    }
  }

  /**
   * 🔑 Iniciar sesión con Google OAuth
   * Redirige al backend que maneja el flujo completo de OAuth
   */
  loginWithGoogle(): void {
    console.log('🔑 Iniciando flujo de Google OAuth...');
    console.log(`📍 Redirigiendo a: ${API_URL}/auth/google`);
    window.location.href = `${API_URL}/auth/google`;
  }

  /**
   * 🚪 Cerrar sesión
   * Llama al backend para limpiar la cookie httpOnly y limpia localStorage
   */
  async logout(): Promise<void> {
    console.log('🚪 LOGOUT - Limpiando sesión');
    
    try {
      // Llamar al endpoint de logout para limpiar la cookie httpOnly
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Envía la cookie para que el backend la limpie
      });
      console.log('✅ Cookie httpOnly limpiada en el backend');
    } catch (error) {
      console.error('⚠️ Error al limpiar cookie en backend:', error);
    } finally {
      // Siempre limpiar localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem(USER_KEY);
        console.log('✅ localStorage limpiado');
      }
    }
  }

  /**
   * 💾 Guardar autenticación en localStorage (solo para login tradicional)
   * Para OAuth con cookie httpOnly, solo se guarda el usuario, no el token
   */
  private saveAuth(token: string, user: User): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      // Para login tradicional, también guardamos el token
      // (el apiClient lo leerá para el header Authorization)
    }
  }

  /**
   * 📖 Obtener usuario guardado en localStorage
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
   * ✅ Verificar si el usuario está autenticado
   * Comprueba si hay un usuario guardado en localStorage
   */
  isAuthenticated(): boolean {
    return !!this.getUser();
  }

  /**
   * Normalizar áreas del backend a formato uniforme
   */
  private normalizeAreas(areas: any): Array<{ id: string; name: string }> {
    if (!areas || !Array.isArray(areas)) return [];
    
    return areas.map(item => {
      // Si es un objeto de asignación con propiedad 'area' (areaAssignments)
      if (item.area && typeof item.area === 'object') {
        return { 
          id: item.area.id || item.areaId, 
          name: item.area.name || item.area.id 
        };
      }
      // Si ya es un objeto con id y name directamente
      if (typeof item === 'object' && item.id && item.name) {
        return { id: item.id, name: item.name };
      }
      // Si es un string (solo ID)
      if (typeof item === 'string') {
        return { id: item, name: item };
      }
      // Si tiene areaId en lugar de id
      if (item.areaId) {
        return { id: item.areaId, name: item.name || item.areaId };
      }
      return null;
    }).filter(Boolean) as Array<{ id: string; name: string }>;
  }

  /**
   * Normalizar bodegas del backend a formato uniforme
   */
  private normalizeWarehouses(warehouses: any): Array<{ id: string; name: string }> {
    if (!warehouses || !Array.isArray(warehouses)) return [];
    
    return warehouses.map(item => {
      // Si es un objeto de asignación con propiedad 'warehouse' (warehouseAssignments)
      if (item.warehouse && typeof item.warehouse === 'object') {
        return { 
          id: item.warehouse.id || item.warehouseId, 
          name: item.warehouse.name || item.warehouse.id 
        };
      }
      // Si ya es un objeto con id y name directamente
      if (typeof item === 'object' && item.id && item.name) {
        return { id: item.id, name: item.name };
      }
      // Si es un string (solo ID)
      if (typeof item === 'string') {
        return { id: item, name: item };
      }
      // Si tiene warehouseId en lugar de id
      if (item.warehouseId) {
        return { id: item.warehouseId, name: item.name || item.warehouseId };
      }
      return null;
    }).filter(Boolean) as Array<{ id: string; name: string }>;
  }
}

export const authService = new AuthService();
