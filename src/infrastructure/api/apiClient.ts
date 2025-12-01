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
        console.log('🔐 Token being used:', `${token.substring(0, 20)}...`);
        headers["Authorization"] = `Bearer ${token}`;
        
        // Decodificar JWT para debug (solo en desarrollo)
        if (process.env.NODE_ENV === 'development') {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              const exp = payload.exp ? new Date(payload.exp * 1000) : null;
              const now = new Date();
              console.log('📋 Token info:', {
                userId: payload.sub || payload.userId,
                email: payload.email,
                expires: exp?.toLocaleString(),
                isExpired: exp ? exp < now : 'unknown',
              });
            }
          } catch (e) {
            console.warn('⚠️ Could not decode token', e);
          }
        }
      } else {
        console.warn('⚠️ Auth required but no token found in localStorage');
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

  async get<T>(endpoint: string, requiresAuth: boolean = true): Promise<T> {
    const fullUrl = `${this.baseURL}${endpoint}`;
    console.log('🔗 Full URL:', fullUrl);
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: this.getHeaders(requiresAuth),
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
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, requiresAuth: boolean = true): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "DELETE",
      headers: this.getHeaders(requiresAuth),
    });

    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient();
