/**
 * Helper de almacenamiento de tokens de autenticación
 * Maneja accessToken y refreshToken en localStorage de forma segura
 */

const ACCESS_TOKEN_KEY = 'smartpack:accessToken';
const REFRESH_TOKEN_KEY = 'smartpack:refreshToken';
const USER_KEY = 'smartpack:user';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Verifica si estamos en el cliente (no en SSR)
 */
function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Guarda los tokens de autenticación en localStorage
 */
export function setTokens(tokens: AuthTokens): void {
  if (!isClient()) return;

  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    
    if (tokens.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error al guardar tokens:', error);
  }
}

/**
 * Obtiene el accessToken de localStorage
 */
export function getAccessToken(): string | null {
  if (!isClient()) return null;

  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Error al leer accessToken:', error);
    return null;
  }
}

/**
 * Obtiene el refreshToken de localStorage
 */
export function getRefreshToken(): string | null {
  if (!isClient()) return null;

  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error al leer refreshToken:', error);
    return null;
  }
}

/**
 * Limpia todos los tokens del localStorage
 */
export function clearTokens(): void {
  if (!isClient()) return;

  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error al limpiar tokens:', error);
  }
}

/**
 * Verifica si hay tokens almacenados
 */
export function hasTokens(): boolean {
  return !!getAccessToken();
}

/**
 * Guarda el usuario en localStorage
 */
export function setUser(user: any): void {
  if (!isClient()) return;

  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error al guardar usuario:', error);
  }
}

/**
 * Obtiene el usuario de localStorage
 */
export function getUser<T = any>(): T | null {
  if (!isClient()) return null;

  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error('Error al leer usuario:', error);
    return null;
  }
}

/**
 * Limpia el usuario del localStorage
 */
export function clearUser(): void {
  if (!isClient()) return;

  try {
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error al limpiar usuario:', error);
  }
}

/**
 * Limpia toda la información de autenticación
 */
export function clearAuth(): void {
  clearTokens();
  clearUser();
  
  // Limpiar también claves legacy por si existen
  if (isClient()) {
    try {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('kreatech_user');
      sessionStorage.clear();
    } catch (error) {
      console.error('Error al limpiar auth legacy:', error);
    }
  }
}
