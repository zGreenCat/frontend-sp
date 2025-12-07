import { ApiError } from "@/shared/types/auth.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export class ApiClient {
  private baseURL: string;
  private static isRedirecting = false;

  constructor() {
    this.baseURL = API_URL;
  }

  private getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  }

  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // NO incluir Authorization header - usar solo cookie httpOnly
    // El backend espera la cookie accessToken, no el header Authorization
    if (includeAuth) {
      console.log('🍪 Usando cookie httpOnly para autenticación');
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Detectar sesión expirada (401 Unauthorized)
      if (response.status === 401) {
        this.handleSessionExpired();
        
        throw {
          message: "Su sesión ha expirado",
          statusCode: 401,
          error: "Unauthorized",
        } as ApiError;
      }

      const errorData: ApiError = await response.json().catch(() => ({
        message: "Error al procesar la solicitud",
        statusCode: response.status,
      }));

      throw {
        message: errorData.message || "Error en la solicitud",
        statusCode: response.status,
        error: errorData.error,
      } as ApiError;
    }

    return response.json();
  }

  private handleSessionExpired(): void {
    // Solo ejecutar en el cliente
    if (typeof window === "undefined") return;

    // Evitar múltiples redirects simultáneos
    if (ApiClient.isRedirecting) return;

    // Si ya estamos en login o register, no hacer nada
    const currentPath = window.location.pathname;
    if (currentPath === "/login" || currentPath === "/register" || currentPath.startsWith("/auth/")) {
      return;
    }

    ApiClient.isRedirecting = true;

    // Limpiar almacenamiento local
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.clear();

    // Mostrar toast de sesión expirada (si existe el contenedor de toasts)
    const event = new CustomEvent("session-expired", {
      detail: { message: "Su sesión ha expirado. Por favor, inicie sesión nuevamente." }
    });
    window.dispatchEvent(event);

    // Redirigir al login después de un breve delay
    setTimeout(() => {
      window.location.href = "/login";
      // Resetear la bandera después del redirect para permitir futuros logins
      setTimeout(() => {
        ApiClient.isRedirecting = false;
      }, 2000);
    }, 1500);
  }

  async get<T>(endpoint: string, requiresAuth: boolean = false): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "GET",
      headers: this.getHeaders(requiresAuth),
      credentials: requiresAuth ? 'include' : 'same-origin',
    });

    return this.handleResponse<T>(response);
  }

  async post<T, D = unknown>(
    endpoint: string,
    data: D,
    requiresAuth: boolean = false
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers: this.getHeaders(requiresAuth),
      body: JSON.stringify(data),
      credentials: requiresAuth ? 'include' : 'same-origin',
    });

    return this.handleResponse<T>(response);
  }

  async put<T, D = unknown>(
    endpoint: string,
    data: D,
    requiresAuth: boolean = true
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "PUT",
      headers: this.getHeaders(requiresAuth),
      body: JSON.stringify(data),
      credentials: requiresAuth ? 'include' : 'same-origin',
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(
    endpoint: string,
    requiresAuth: boolean = true
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "DELETE",
      headers: this.getHeaders(requiresAuth),
      credentials: requiresAuth ? 'include' : 'same-origin',
    });

    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient();
