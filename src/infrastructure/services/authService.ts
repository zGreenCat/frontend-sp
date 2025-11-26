import { apiClient } from "@/infrastructure/api/apiClient";
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
    console.log('📤 Register request to:', '/auth/register');
    const response = await apiClient.post<any, RegisterRequest>(
      "/auth/register",
      data,
      false
    );

    console.log('📥 Register response structure:', response);

    // El backend puede devolver diferentes estructuras
    const token = response.token || response.access_token || response.accessToken;
    const user = response.user;

    if (!token || !user) {
      console.error('❌ Invalid register response:', Object.keys(response));
      throw new Error('Respuesta de registro inválida');
    }

    // Guardar token y usuario en localStorage
    this.saveAuth(token, user);

    return { token, user };
  }

  /**
   * Iniciar sesión
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    console.log('📤 Login request to:', '/auth/login');
    const response = await apiClient.post<any, LoginRequest>(
      "/auth/login",
      data,
      false
    );

    console.log('📥 Login response structure:', response);

    // El backend puede devolver diferentes estructuras:
    // Opción 1: { user, token }
    // Opción 2: { access_token, user }
    // Opción 3: { accessToken, user }
    const token = response.token || response.access_token || response.accessToken;
    const user = response.user;

    if (!token) {
      console.error('❌ No token found in response:', Object.keys(response));
      throw new Error('No se recibió token de autenticación');
    }

    if (!user) {
      console.error('❌ No user found in response:', Object.keys(response));
      throw new Error('No se recibió información del usuario');
    }

    console.log('✅ Token extracted successfully:', token.substring(0, 20) + '...');

    // Guardar token y usuario en localStorage
    this.saveAuth(token, user);

    return { token, user };
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  async getProfile(): Promise<User> {
    const user = await apiClient.get<User>("/users/me", true);
    
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
}

export const authService = new AuthService();
