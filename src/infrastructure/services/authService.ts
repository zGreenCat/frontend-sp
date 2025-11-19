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
    const response = await apiClient.post<AuthResponse, RegisterRequest>(
      "/auth/register",
      data,
      false
    );

    // Guardar token y usuario en localStorage
    this.saveAuth(response.token, response.user);

    return response;
  }

  /**
   * Iniciar sesión
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse, LoginRequest>(
      "/auth/login",
      data,
      false
    );

    // Guardar token y usuario en localStorage
    this.saveAuth(response.token, response.user);

    return response;
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  async getProfile(): Promise<User> {
    const user = await apiClient.get<User>("/auth/me", true);
    
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
