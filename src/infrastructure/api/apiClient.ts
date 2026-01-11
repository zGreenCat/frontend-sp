import { ApiError } from "@/shared/types/auth.types";
import { getAccessToken, clearAuth } from "@/lib/auth-storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not set");

export class ApiClient {
  private baseURL: string | undefined;
  private static isRedirecting = false;

  constructor() {
    this.baseURL = API_URL;
  }

  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Incluir Authorization header con Bearer token
    if (includeAuth) {
      const accessToken = getAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    return headers;
  }

private async handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      // 👇 Revisar a qué endpoint se le hizo el fetch
      let pathname = '';
      try {
        const url = new URL(response.url);
        pathname = url.pathname;
      } catch {
        // Si falla el parse, asumimos normal
      }

      // 🚫 NO dispares cierre de sesión para el endpoint de perfil
      if (!pathname.startsWith('/auth/profile')) {
        this.handleSessionExpired();
      } else {
        console.warn('[ApiClient] 401 en /auth/profile – NO redirijo, solo informo al caller');
      }

      throw {
        message: "Su sesión ha expirado o no está autenticado",
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

  const currentPath = window.location.pathname;

  // Si estamos en páginas públicas, no hacer nada
  if (
    currentPath === "/login" ||
    currentPath === "/register" ||
    currentPath.startsWith("/auth/")
  ) {
    return;
  }

  // Verificar si hay token almacenado
  const hasToken = getAccessToken();
  if (!hasToken) {
    console.log(
      "⚠️ 401 sin token almacenado → no se redirige como sesión expirada"
    );
    return;
  }

  // Si acabamos de llegar (menos de 3 segundos en la página), puede ser un OAuth redirect
  if (typeof window !== "undefined" && window.performance) {
    const navigationStart = window.performance.timing.navigationStart;
    const now = Date.now();
    const timeSinceLoad = now - navigationStart;

    if (timeSinceLoad < 3000) {
      console.log(
        "⏱️ Página recién cargada, dando tiempo para verificar autenticación..."
      );
      return;
    }
  }

  ApiClient.isRedirecting = true;

  // Limpiar almacenamiento usando el helper centralizado
  clearAuth();

  const event = new CustomEvent("session-expired", {
    detail: {
      message: "Su sesión ha expirado. Por favor, inicie sesión nuevamente.",
    },
  });
  window.dispatchEvent(event);

  setTimeout(() => {
    window.location.href = "/login";
    setTimeout(() => {
      ApiClient.isRedirecting = false;
    }, 2000);
  }, 1500);
}


  async get<T>(endpoint: string, requiresAuth: boolean = false): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
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

  async patch<T, D = unknown>(
    endpoint: string,
    data: D,
    requiresAuth: boolean = true
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "PATCH",
      headers: this.getHeaders(requiresAuth),
      body: JSON.stringify(data),
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
    });

    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient();
