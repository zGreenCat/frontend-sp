import { ApiError } from "@/shared/types/auth.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export class ApiClient {
  private baseURL: string;

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

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        // Si hay token en localStorage, usarlo en el header (login tradicional)
        headers["Authorization"] = `Bearer ${token}`;
        console.log('🔑 Usando Authorization header con token');
      } else {
        // Si no hay token, usaremos cookie httpOnly (login con Google)
        console.log('🍪 Usando cookie httpOnly para autenticación');
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
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
}

export const apiClient = new ApiClient();
