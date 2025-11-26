// Utilidades de debugging para autenticación
// Ejecuta estas funciones en la consola del navegador (F12)

// Ver token actual
export function debugToken() {
  const token = localStorage.getItem('token');
  console.log('🔐 Token stored:', token);
  
  if (token) {
    console.log('📏 Token length:', token.length);
    console.log('🔍 Token preview:', token.substring(0, 50) + '...');
    
    // Intentar decodificar JWT (solo la parte payload, sin verificar)
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('📦 Token payload:', payload);
        
        if (payload.exp) {
          const expDate = new Date(payload.exp * 1000);
          const now = new Date();
          const isExpired = expDate < now;
          console.log(`⏰ Expiration: ${expDate.toLocaleString()}`);
          console.log(`⏱️ Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`);
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
  const userStr = localStorage.getItem('user');
  console.log('👤 User stored:', userStr);
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('📋 User data:', user);
    } catch (e) {
      console.log('❌ Invalid user JSON:', e);
    }
  } else {
    console.log('❌ No user found in localStorage');
  }
}

// Probar request con el token actual
export async function testAuthRequest() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.log('❌ No token found');
    return;
  }
  
  console.log('🧪 Testing GET /users with token...');
  
  try {
    const response = await fetch('http://localhost:3000/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Request successful:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Request failed:', errorText);
    }
  } catch (error) {
    console.log('❌ Network error:', error);
  }
}

// Limpiar autenticación
export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('🗑️ Auth cleared. Please refresh the page.');
}

// Información completa
export function debugAll() {
  console.log('=== 🔍 AUTH DEBUG INFO ===');
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
    clear: clearAuth,
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
