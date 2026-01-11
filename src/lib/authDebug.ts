// Utilidades de debugging para autenticación
// Ejecuta estas funciones en la consola del navegador (F12)

import { getAccessToken, clearAuth } from './auth-storage';

// Ver token actual
export function debugToken() {
  const token = getAccessToken();
  
  if (token) {
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    // Intentar decodificar JWT (solo la parte payload, sin verificar)
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('📦 Payload:', payload);
        
        if (payload.exp) {
          const expDate = new Date(payload.exp * 1000);
          const now = new Date();
          const isExpired = expDate < now;
          console.log('⏰ Expires:', expDate.toLocaleString());
          console.log(isExpired ? '❌ Token EXPIRED' : '✅ Token valid');
        }
      }
    } catch (e) {
      console.log('⚠️ Token is not a valid JWT');
    }
  } else {
    console.log('❌ No token found in localStorage');
  }
}

// Ver usuario actual
export function debugUser() {
  const userStr = localStorage.getItem('smartpack:user');
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('✅ User found:', user);
    } catch (e) {
      console.log('❌ Invalid user JSON:', e);
    }
  } else {
    console.log('❌ No user found in localStorage');
  }
}

// Probar request con el token actual (Auth: usa apiClient para garantizar Authorization Bearer)
export async function testAuthRequest() {
  const token = getAccessToken();
  
  if (!token) {
    console.log('❌ No token found');
    return;
  }
  
  console.log('🔄 Testing authenticated request...');
  
  try {
    // Auth: Usando fetch directo SOLO para debugging, en producción usar apiClient
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Request successful:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Request failed:', response.status, errorText);
    }
  } catch (error) {
    console.log('❌ Network error:', error);
  }
}

// Limpiar autenticación
export function clearAuthDebug() {
  clearAuth();
  console.log('✅ Auth cleared');
}

// Información completa
export function debugAll() {
  console.log('=========================');
  console.log('🔐 AUTH DEBUG INFO');
  console.log('=========================');
  debugToken();
  console.log('');
  debugUser();
  console.log('=========================');
}

// Exponer globalmente para uso en consola
if (typeof window !== 'undefined') {
  (window as any).authDebug = {
    token: debugToken,
    user: debugUser,
    test: testAuthRequest,
    clear: clearAuthDebug,
    all: debugAll,
  };
  
  console.log(`
🔧 Auth Debug Tools Available:
  - authDebug.all()    : Ver toda la información
  - authDebug.token()  : Ver token y su contenido
  - authDebug.user()   : Ver usuario almacenado
  - authDebug.test()   : Probar request GET /users
  - authDebug.clear()  : Limpiar autenticación
  `);
}
