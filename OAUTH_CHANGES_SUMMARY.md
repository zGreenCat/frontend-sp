# 📋 Guía Completa: Implementación de OAuth con Cookie httpOnly

## 🎯 Objetivo
Implementar autenticación OAuth con Google usando cookies httpOnly para máxima seguridad. Esta guía contiene TODO lo necesario para que el frontend funcione correctamente, incluyendo conceptos, requisitos del backend, paso a paso de implementación y guías de debugging.

## 📚 Tabla de Contenidos
1. [Conceptos Clave](#conceptos-clave)
2. [¿Qué es una Cookie httpOnly?](#qué-es-una-cookie-httpsecure)
3. [Requisitos del Backend - Checklist](#requisitos-del-backend---checklist)
4. [Arquitetura de la Solución](#arquitetura-de-la-solución)
5. [Implementación Frontend Paso a Paso](#implementación-frontend-paso-a-paso)
6. [Flujo Completo OAuth](#flujo-completo-oauth)
7. [Archivos Modificados - Detalles](#archivos-modificados---detalles)
8. [Seguridad Implementada](#seguridad-implementada)
9. [Debugging y Logs](#debugging-y-logs)
10. [Troubleshooting](#troubleshooting)
11. [Prompt para Claude](#prompt-para-claude)

---

## 🧠 Conceptos Clave

### ¿Qué es una Cookie httpOnly?
```
Una cookie que:
✅ JavaScript NO puede acceder (previene XSS attacks)
✅ El navegador la envía automáticamente en cada request
✅ Se almacena de forma segura en el navegador
✅ Solo el servidor puede crear, actualizar o eliminar
✅ El backend puede validarla en cada petición

EJEMPLO CON FETCH:
fetch('/api/endpoint', {
  credentials: 'include'  // ← Navegador envía la cookie automáticamente
})
// El navegador hace esto internamente:
// Cookie: accessToken=eyJ0eXAiOiJKV1QiLCJhbGc...
```

### El Flujo OAuth Completo
```
┌─────────────────────────────────────────────────────────────┐
│ FLUJO VISUAL DE OAUTH CON COOKIE HTTPSECURE                 │
└─────────────────────────────────────────────────────────────┘

1️⃣  Usuario Hace Clic "Sign in with Google"
    ↓
2️⃣  Frontend Redirige a Backend OAuth
    GET http://backend.com/auth/oauth/google
    ↓
3️⃣  Backend Procesa Google OAuth
    - Obtiene código de Google
    - Valida token
    - Crea usuario si no existe
    ↓
4️⃣  Backend Genera JWT y Cookie httpOnly
    const jwt = sign(userData, SECRET)
    res.cookie('accessToken', jwt, {
      httpOnly: true,  ← JavaScript NO puede acceder
      secure: true,    ← Solo en HTTPS
      sameSite: 'lax'  ← Protección CSRF
    })
    res.redirect('/auth/success')
    ↓
5️⃣  Navegador Recibe SET-COOKIE Header
    Set-Cookie: accessToken=eyJ...; HttpOnly; Secure; SameSite=Lax
    ↓
6️⃣  Navegador Almacena Cookie httpOnly
    ✅ Segura en el navegador
    ✅ JavaScript NO puede acceder
    ✅ Se envía automáticamente en requests
    ↓
7️⃣  Frontend Carga /auth/success Page
    useEffect ejecuta handleAuthSuccess()
    ↓
8️⃣  Frontend Llama authService.getProfile()
    GET /auth/me con { credentials: 'include' }
    ↓
9️⃣  Navegador Envía Cookie Automáticamente
    GET /auth/me
    Cookie: accessToken=eyJ...
    ↓
🔟 Backend Valida JWT
    const token = req.cookies.accessToken
    const decoded = jwt.verify(token, SECRET)
    return { id, email, firstName, lastName }
    ↓
1️⃣1️⃣ Frontend Guarda Usuario en localStorage
    localStorage.setItem('user', JSON.stringify(user))
    ↓
1️⃣2️⃣ Frontend Redirige a Dashboard
    router.push('/dashboard')
    ↓
1️⃣3️⃣ En Futuras Requests (automático)
    Todas las requests incluyen:
    credentials: 'include'
    ↓
1️⃣4️⃣ Navegador Envía Cookie Automáticamente
    El navegador hace esto sin que hagas nada
    La cookie se envía en Header: Cookie
    ↓
✅ BACKEND VALIDA COOKIE EN CADA REQUEST
```

### Por qué localStorage NO guarda el token

```javascript
❌ INSEGURO - NO HAGAS ESTO:
localStorage.setItem('token', jwtToken)
Razón: Si hay XSS attack (inyección de script), el atacante 
       obtiene acceso a localStorage y roba el token

✅ SEGURO - ESTO ES LO CORRECTO:
1) Cookie httpOnly guarda el JWT
   - Generada por el backend
   - JavaScript NO puede acceder
   - Navegador la envía automáticamente
   
2) localStorage guarda SOLO datos públicos
   localStorage.setItem('user', JSON.stringify({
     id: 123,
     email: 'user@example.com',
     firstName: 'John',
     lastName: 'Doe'
   }))
   Razón: Si hay XSS, el atacante solo ve datos públicos
          El token JWT está seguro en la cookie httpOnly
```

### ¿Cuándo Se Envía la Cookie?

```javascript
// ✅ AUTOMÁTICO CON credentials: 'include'
fetch('/api/products', {
  credentials: 'include'  // Navegador envía cookie automáticamente
})
// El navegador hace internamente:
// POST /api/products
// Cookie: accessToken=eyJ...
// [resto de headers y body]

// ❌ NO SE ENVÍA sin credentials
fetch('/api/products')
// No incluye la cookie httpOnly

// ⚠️ SOLO SE ENVÍA SI CORS permite
// Backend DEBE tener:
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true  // ← CRÍTICO
}))
```

---

## ✅ Requisitos del Backend - Checklist

**El equipo backend DEBE implementar esto ANTES de que el frontend funcione:**

### 1. ✅ CORS Configurado Correctamente
```javascript
// Backend (Node.js/Express ejemplo)
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3000',  // Tu URL del frontend (o tuURL.com en prod)
  credentials: true,                 // ← CRÍTICO: Permite cookies
  optionsSuccessStatus: 200
}));

// Alternativa si tienes múltiples orígenes:
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://yourdomain.com'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

**Verificación:** En DevTools Network, verifica que `GET /auth/me` tenga:
- Response Header: `Access-Control-Allow-Credentials: true`
- Response Header: `Access-Control-Allow-Origin: http://localhost:3000`

### 2. ✅ Cookie httpOnly en OAuth Callback
```javascript
// Backend - Después de validar Google OAuth
app.get('/auth/oauth/google/callback', (req, res) => {
  try {
    // 1. Obtener código de Google
    const { code } = req.query;
    
    // 2. Intercambiar código por token de Google
    const googleToken = await exchangeCodeForToken(code);
    
    // 3. Obtener datos del usuario desde Google
    const googleUser = await getGoogleUserInfo(googleToken);
    
    // 4. Encontrar o crear usuario en base de datos
    let user = await User.findOne({ email: googleUser.email });
    if (!user) {
      user = await User.create({
        email: googleUser.email,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        picture: googleUser.picture
      });
    }
    
    // 5. ✅ GENERAR JWT
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // 6. ✅ GUARDAR JWT EN COOKIE HTTPSECURE
    res.cookie('accessToken', jwtToken, {
      httpOnly: true,                              // ← JavaScript NO puede acceder
      secure: process.env.NODE_ENV === 'production', // true solo en HTTPS
      sameSite: 'lax',                             // Protección CSRF
      maxAge: 3600000,                             // 1 hora en milisegundos
      path: '/',                                   // Disponible en toda la app
      domain: process.env.COOKIE_DOMAIN            // Opcional: dominio específico
    });
    
    // 7. REDIRIGIR A FRONTEND SUCCESS PAGE
    res.redirect(`http://localhost:3000/auth/success`);
    
  } catch (error) {
    console.error('OAuth error:', error);
    res.redirect(`http://localhost:3000/auth/error?message=${error.message}`);
  }
});
```

**En Producción:**
```javascript
// En HTTPS (obligatorio para secure: true)
res.cookie('accessToken', jwtToken, {
  httpOnly: true,
  secure: true,        // ← DEBE ser true en HTTPS
  sameSite: 'strict',  // Más restrictivo en producción
  maxAge: 3600000,
  domain: '.yourdomain.com'
});
```

### 3. ✅ Endpoint para Validar Cookie: GET /auth/me
```javascript
// Backend - Endpoint crítico que valida la cookie
app.get('/auth/me', (req, res) => {
  try {
    // 1. Leer token desde la cookie
    const token = req.cookies.accessToken;
    
    // 2. Si no hay token, retornar 401
    if (!token) {
      return res.status(401).json({ 
        error: 'No authentication token found',
        code: 'NO_TOKEN'
      });
    }
    
    // 3. Validar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Obtener usuario completo desde BD
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // 5. Retornar datos del usuario (SIN el token)
    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      picture: user.picture
    });
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({ 
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
});
```

### 4. ✅ Endpoint para Logout (Limpiar Cookie)
```javascript
app.post('/auth/logout', (req, res) => {
  // Limpiar la cookie estableciendo maxAge en 0
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  
  return res.json({ message: 'Logged out' });
});
```

### 5. ✅ Endpoint para Refrescar Token (Opcional pero Recomendado)
```javascript
app.post('/auth/refresh', (req, res) => {
  try {
    const oldToken = req.cookies.accessToken;
    
    if (!oldToken) {
      return res.status(401).json({ error: 'No token' });
    }
    
    // Validar token (puede estar expirado)
    let decoded;
    try {
      decoded = jwt.verify(oldToken, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name !== 'TokenExpiredError') {
        throw err;
      }
      // Si está expirado, decodificar sin validar
      decoded = jwt.decode(oldToken);
    }
    
    // Generar nuevo token
    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Guardar nueva cookie
    res.cookie('accessToken', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000,
      path: '/'
    });
    
    return res.json({ message: 'Token refreshed' });
    
  } catch (error) {
    return res.status(401).json({ error: 'Cannot refresh token' });
  }
});
```

### ✅ Verificación - Backend Implementado

Antes de continuar con frontend, verifica que el backend tiene esto:

```bash
# Test: Obtener tokens de Google OAuth
curl "http://localhost:5000/auth/oauth/google/callback?code=GOOGLE_CODE"

# Debería redirigir a frontend y:
# 1. Establecer cookie httpOnly
# 2. Redirigir a /auth/success

# Test: Llamar a /auth/me con cookie
curl -H "Cookie: accessToken=..." http://localhost:5000/auth/me

# Debería retornar:
# { "id": 123, "email": "user@example.com", ... }
```

---

## 🏗️ Arquitetura de la Solución

```
┌──────────────────────────────────────────────────────────────┐
│                    NAVEGADOR WEB                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ FRONTEND REACT (Next.js)                            │   │
│  │                                                     │   │
│  │  - Pages:                                           │   │
│  │    • /login - Sign in with Google button            │   │
│  │    • /auth/success - getProfile() + redirect       │   │
│  │    • /auth/error - Mostrar errores                 │   │
│  │    • /dashboard - ProtectedRoute valida usuario    │   │
│  │                                                     │   │
│  │  - Hooks:                                           │   │
│  │    • useAuth() - Lee user de localStorage           │   │
│  │                                                     │   │
│  │  - Services:                                        │   │
│  │    • authService.getProfile() → GET /auth/me       │   │
│  │    • authService.logout() → POST /auth/logout      │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ALMACENAMIENTO LOCAL                                │   │
│  │                                                     │   │
│  │ localStorage:                                       │   │
│  │ {                                                   │   │
│  │   "user": {                                         │   │
│  │     "id": 123,                                      │   │
│  │     "email": "user@example.com",                   │   │
│  │     "firstName": "John",                            │   │
│  │     "lastName": "Doe"                              │   │
│  │   }                                                 │   │
│  │ }                                                   │   │
│  │                                                     │   │
│  │ Cookies (httpOnly):                                 │   │
│  │ {                                                   │   │
│  │   "accessToken": "eyJ0eXAi..." ← Segura, JWT       │   │
│  │ }                                                   │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                           ↕
                    HTTP/HTTPS (Network)
                    ↓ Cookies Automáticas
                    ↑ JSON Responses
                           ↕
┌──────────────────────────────────────────────────────────────┐
│                      BACKEND API                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ENDPOINTS IMPORTANTES                              │   │
│  │                                                     │   │
│  │ GET /auth/oauth/google/callback?code=...           │   │
│  │ └─→ Valida Google OAuth                            │   │
│  │ └─→ Genera JWT                                     │   │
│  │ └─→ Guarda en cookie httpOnly                      │   │
│  │ └─→ Redirige a /auth/success                       │   │
│  │                                                     │   │
│  │ GET /auth/me                                        │   │
│  │ ├─ Recibe: Cookie: accessToken=...                 │   │
│  │ ├─ Valida JWT                                      │   │
│  │ └─→ Retorna: { id, email, firstName, lastName }   │   │
│  │                                                     │   │
│  │ POST /auth/logout                                  │   │
│  │ ├─ Recibe: Cookie: accessToken=...                │   │
│  │ └─→ Limpia cookie                                  │   │
│  │                                                     │   │
│  │ GET /api/protected (ejemplo)                       │   │
│  │ ├─ Recibe: Cookie: accessToken=...                │   │
│  │ ├─ Valida JWT                                      │   │
│  │ └─→ Retorna datos si usuario autenticado           │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ BASE DE DATOS                                       │   │
│  │                                                     │   │
│  │ Users Table:                                        │   │
│  │ - id: UUID                                          │   │
│  │ - email: string (unique)                            │   │
│  │ - firstName: string                                 │   │
│  │ - lastName: string                                  │   │
│  │ - picture: string (URL)                             │   │
│  │ - createdAt: timestamp                              │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementación Frontend Paso a Paso

Esta sección te guía paso a paso para implementar OAuth en el frontend.

### 🔴 Pre-requisito: Backend Configurado

**ANTES de hacer cualquier cosa en frontend, verifica que el backend tiene:**
- [ ] CORS configurado con `credentials: true`
- [ ] Endpoint OAuth que genera cookie httpOnly
- [ ] Endpoint GET `/auth/me` que valida la cookie
- [ ] Endpoint POST `/auth/logout` para limpiar cookie

**Verificación rápida:**
```bash
# Test CORS
curl -i http://localhost:5000/auth/me

# Debería retornar 401 (sin cookie es normal)
# Verifica estos headers en response:
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Origin: http://localhost:3000
```

---

### Paso 1: Crear `src/infrastructure/services/authService.ts`

**Objetivo:** Servicio que maneja todas las llamadas OAuth con cookie httpOnly.

```typescript
// src/infrastructure/services/authService.ts

import { User } from '@/domain/entities/User';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const authService = {
  /**
   * 🔐 MÉTODO PRINCIPAL: Obtener perfil del usuario actual
   * 
   * Cómo funciona:
   * 1. Realiza GET /auth/me con credentials: 'include'
   * 2. El navegador envía la cookie httpOnly automáticamente
   * 3. Backend valida el JWT desde la cookie
   * 4. Retorna datos del usuario
   * 5. Guardamos usuario en localStorage
   */
  async getProfile(): Promise<User> {
    console.log('═══════════════════════════════════════════════');
    console.log('🔐 GET PROFILE - Obteniendo usuario');
    console.log('═══════════════════════════════════════════════');
    console.log('📡 Endpoint: GET /auth/me');
    console.log('🍪 Modo: credentials: "include" ← Envía cookies');
    
    try {
      const response = await fetch(`${apiUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // ✅ CLAVE: Naveg envía cookies httpOnly
        // El navegador hace automáticamente:
        // Cookie: accessToken=eyJ0eXAi...
      });
      
      console.log(`📊 Status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`Auth error: ${response.status}`);
      }
      
      const user = await response.json();
      
      console.log('✅ Cookie httpOnly validada correctamente');
      console.log(`👤 Usuario: ${user.email}`);
      
      // ✅ Guardar usuario en localStorage (NO el token)
      localStorage.setItem('user', JSON.stringify(user));
      console.log('💾 Usuario guardado en localStorage');
      
      return user;
      
    } catch (error) {
      console.error('❌ Error:', error);
      localStorage.removeItem('user');
      throw error;
    }
  },

  /**
   * 🚪 LOGOUT: Limpiar sesión
   */
  async logout(): Promise<void> {
    console.log('🚪 LOGOUT - Limpiando sesión');
    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      localStorage.removeItem('user');
      console.log('✅ Sesión limpiada');
    }
  },
};
```

---

### Paso 2: Crear `src/hooks/use-auth.tsx`

**Objetivo:** Hook que gestiona el estado de autenticación del usuario.

```typescript
// src/hooks/use-auth.tsx

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/domain/entities/User';
import { authService } from '@/infrastructure/services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    console.log('═══════════════════════════════════════════════');
    console.log('🔐 useAuth - INICIALIZANDO');
    console.log('═══════════════════════════════════════════════');
    
    try {
      // Paso 1: ¿Hay usuario en localStorage?
      const savedUser = localStorage.getItem('user');
      
      if (savedUser) {
        console.log('✅ Usuario encontrado en localStorage');
        setUser(JSON.parse(savedUser));
        return;
      }

      console.log('⚠️ Sin usuario en localStorage');
      console.log('📡 Intentando getProfile() con cookie...');

      // Paso 2: Obtener perfil (usa cookie httpOnly)
      const currentUser = await authService.getProfile();
      setUser(currentUser);
      
    } catch (error) {
      console.log('ℹ️ Sin autenticación válida');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
```

---

### Paso 3: Actualizar `app/providers.tsx`

**Objetivo:** Agregar AuthProvider en la aplicación.

```typescript
// app/providers.tsx

'use client';

import { AuthProvider } from '@/hooks/use-auth';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
```

Luego asegúrate que en `app/layout.tsx` está:
```typescript
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

### Paso 4: Crear `app/login/page.tsx`

**Objetivo:** Página de login con botón Sign in with Google.

```typescript
// app/login/page.tsx

'use client';

export default function LoginPage() {
  const handleGoogleSignIn = () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    // Redirigir a Google OAuth en el backend
    window.location.href = `${backendUrl}/auth/oauth/google`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          SmartPack
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Ingresa para continuar
        </p>

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>
      </div>
    </div>
  );
}
```

---

### Paso 5: Crear `app/(auth)/auth/success/page.tsx`

**Objetivo:** Página de éxito OAuth que obtiene el usuario y redirige.

```typescript
// app/(auth)/auth/success/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/infrastructure/services/authService';

export default function AuthSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    handleAuthSuccess();
  }, [router]);

  const handleAuthSuccess = async () => {
    console.log('═══════════════════════════════════════════════');
    console.log('🔄 AUTH SUCCESS - INICIANDO FLUJO');
    console.log('═══════════════════════════════════════════════');
    
    try {
      console.log('📡 Paso 1: Obteniendo perfil con cookie...');
      
      const user = await authService.getProfile();

      console.log('✓ Paso 2: Autenticación exitosa');
      console.log(`   Email: ${user?.email}`);

      console.log('📍 Paso 3: Redirigiendo a dashboard...');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.push('/dashboard');

    } catch (error) {
      console.error('❌ Error:', error);
      router.push(`/auth/error?message=${encodeURIComponent(String(error))}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-flex animate-spin mb-4">
          <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
          </svg>
        </div>
        <p className="text-gray-600">Completando autenticación...</p>
      </div>
    </div>
  );
}
```

---

### Paso 6: Crear `app/(auth)/auth/error/page.tsx`

```typescript
// app/(auth)/auth/error/page.tsx

'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'Error en autenticación';

  return (
    <div className="flex items-center justify-center min-h-screen bg-red-50">
      <div className="max-w-md bg-white rounded-lg shadow p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <Link
          href="/login"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Volver a Intentar
        </Link>
      </div>
    </div>
  );
}
```

---

### Paso 7: Crear `app/(dashboard)/layout.tsx` con Protección

```typescript
// app/(dashboard)/layout.tsx

'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex animate-spin mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
            </svg>
          </div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">SmartPack</h1>
          <div className="text-sm text-gray-600">
            {user?.email}
          </div>
        </div>
      </nav>
      <main className="container mx-auto py-8">
        {children}
      </main>
    </div>
  );
}
```

---

## 📁 Archivos Modificados - Detalles

---

### 2. **`src/hooks/use-auth.tsx`**

#### Cambio Principal: Lógica de Inicialización de Autenticación

**Antes:**
```typescript
// Intentaba obtener token de localStorage
// Si no estaba, intentaba obtener perfil
// Si fallaba, limpiaba la autenticación
```

**Después:**
```typescript
const initAuth = async () => {
  // PASO 1: Verificar si usuario está en localStorage
  if (savedUser) {
    setUser(savedUser);
    return; // ✅ No necesita hacer más
  }
  
  // PASO 2: Si NO hay usuario guardado, intentar obtener perfil
  // La cookie httpOnly está en el navegador automáticamente
  // getProfile() la enviará con credentials: 'include'
  try {
    const currentUser = await authService.getProfile();
    setUser(currentUser);
  } catch (error) {
    // Sin cookie válida = no autenticado
    setUser(null);
  }
};
```

**Logs agregados:**
```javascript
console.log("🔐 useAuth - INICIALIZANDO AUTENTICACIÓN");
console.log("   - Token en localStorage:", token ? "✓" : "✗");
console.log("   - Usuario guardado:", savedUser ? "✓" : "✗");
console.log("✓ Usando usuario guardado de localStorage");
console.log("⚠️ No hay usuario guardado. Intentando obtener perfil con cookie httpOnly...");
```

**Por qué cambió:**
- En OAuth con httpOnly NO guardamos el token en localStorage
- El usuario se guarda en localStorage después de `getProfile()`
- En próximas cargas, usamos el usuario guardado
- Si se recarga la página, la cookie httpOnly sigue en el navegador

---

### 3. **`app/(auth)/auth/success/page.tsx`**

#### Cambios: Logs Detallados del Flujo OAuth

```typescript
useEffect(() => {
  const handleAuthSuccess = async () => {
    console.log("═══════════════════════════════════════════════");
    console.log("🔄 AuthSuccess: INICIANDO FLUJO OAUTH");
    console.log("═══════════════════════════════════════════════");
    
    // Paso 1: Llamar a getProfile()
    // Esto envía GET /auth/me con la cookie httpOnly
    const user = await authService.getProfile();
    
    console.log("✓ Paso 2: Autenticación exitosa");
    console.log("   Email:", user?.email);
    console.log("   ID:", user?.id);
    
    // Paso 3: Redirigir a dashboard
    router.push("/dashboard");
  };
}, [router]);
```

**Lo importante aquí:**
- `getProfile()` ya guarda el usuario en localStorage
- Después del redirect a `/dashboard`, el usuario sigue disponible
- `ProtectedRoute` en dashboard accede a través del `useAuth` hook

---

### 4. **`app/(auth)/auth/error/page.tsx`**

#### Cambios: Mostrar Credenciales en Debug

**Agregado en la sección de debug:**

```typescript
const debugInfo = useMemo(() => {
  // 🔐 PRINT CREDENCIALES COMPLETAS
  console.log("═══════════════════════════════════════════════");
  console.log("🔐 CREDENCIALES ENVIADAS A /auth/me");
  console.log("═══════════════════════════════════════════════");
  console.log("📡 URL: GET /auth/me");
  console.log("📊 Headers:");
  console.log("  - Content-Type: application/json");
  console.log("  - Authorization: Bearer [token si existe]");
  console.log("\n🍪 Cookies (enviadas automáticamente):");
  console.log("  - accessToken: [httpOnly - enviada automáticamente]");
  // ... resto de logs
}, [searchParams]);
```

**En la UI:**
```tsx
{/* Credenciales Enviadas */}
<div className="space-y-2">
  <h4>🔐 Credenciales Que Se Envían al Backend</h4>
  <div className="bg-muted p-4 rounded">
    <div>🌐 GET /auth/me</div>
    <div>📊 Headers: Content-Type, Authorization</div>
    <div>🍪 Cookies (httpOnly): accessToken</div>
  </div>
</div>
```

---

### 5. **`app/debug/page.tsx`**

#### Cambios: Test Mejorado de /auth/me

**Agregado:**
```typescript
const testAuthMe = async () => {
  // 📡 Mostrar credenciales que se están enviando
  let credentialsInfo = "═══════════════════════════════════════════════\n";
  credentialsInfo += "📡 CREDENCIALES ENVIADAS A /auth/me\n";
  credentialsInfo += "═══════════════════════════════════════════════\n";
  credentialsInfo += `🌐 URL: GET ${apiUrl}/auth/me\n`;
  credentialsInfo += `📋 Mode: credentials: 'include' ← Envía cookies httpOnly\n`;
  
  // Mostrar headers
  credentialsInfo += "\n📊 HEADERS:\n";
  credentialsInfo += "  Content-Type: application/json\n";
  if (token) {
    credentialsInfo += `  Authorization: Bearer ${token.substring(0, 30)}...\n`;
  }
  
  // Mostrar cookies
  credentialsInfo += "\n🍪 COOKIES (enviadas automáticamente):\n";
  // ... lista de cookies
  
  setTestResult(credentialsInfo);
  
  // Hacer el request
  const response = await fetch(`${apiUrl}/auth/me`, {
    method: "GET",
    headers,
    credentials: "include",
  });
  
  // Mostrar resultado
};
```

**Nueva sección en UI:**
```tsx
{/* Credenciales Que Se Envían al Backend */}
<Card>
  <CardHeader>
    <CardTitle>🔐 Credenciales Que Se Envían al Backend</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="bg-muted p-4 rounded text-sm font-mono">
      GET /auth/me
      Headers: Content-Type, Authorization (si existe)
      Cookies (httpOnly): accessToken
    </div>
  </CardContent>
</Card>
```

---

## 🔄 Flujo Completo OAuth con Cambios

```
1️⃣ USUARIO HACE CLIC "Sign in with Google"
   ↓
2️⃣ REDIRIGE A BACKEND OAUTH
   Backend procesa Google Auth
   ↓
3️⃣ BACKEND GENERA JWT Y COOKIE HTTPSECURE
   res.cookie('accessToken', jwt, { httpOnly: true, ... })
   res.redirect('/auth/success')
   ↓
4️⃣ NAVEGADOR RECIBE SET-COOKIE HEADER
   Almacena cookie httpOnly (segura, no en localStorage)
   ↓
5️⃣ FRONTEND CARGA /auth/success PAGE
   useEffect ejecuta handleAuthSuccess()
   ↓
6️⃣ LLAMA authService.getProfile()
   GET /auth/me con credentials: 'include'
   Navegador envía Cookie header automático
   ↓
7️⃣ BACKEND VALIDA JWT DESDE COOKIE
   req.cookies.accessToken → valida JWT
   Retorna usuario si válido
   ↓
8️⃣ FRONTEND GUARDA USUARIO EN localStorage
   localStorage.setItem('user', JSON.stringify(user))
   NO guarda el token (está en cookie)
   ↓
9️⃣ REDIRIGE A /dashboard
   router.push('/dashboard')
   ↓
🔟 ProtectedRoute VERIFICA AUTENTICACIÓN
   useAuth hook carga usuario desde localStorage
   Usuario ya existe → ✅ Acceso permitido
   ↓
✅ USUARIO AUTENTICADO EN DASHBOARD
   Todas las requests usan credentials: 'include'
   Navegador envía cookie automáticamente
```

---

## 🔐 Seguridad Implementada

### Cookie httpOnly
```
✅ JavaScript NO puede acceder (previene XSS)
✅ Solo el navegador la envía
✅ No se expone en localStorage
✅ Validación en el backend
```

### Flujo Seguro
```
✅ Token jamás se ve en la red (está encriptado en cookie)
✅ No hay riesgo de expose en localStorage
✅ CORS con credentials: true valida el origen
✅ SameSite previene CSRF
```

---

## 📊 Datos Almacenados

| Ubicación | Qué | Por qué | Seguridad |
|---|---|---|---|
| **Cookie httpOnly** | JWT Token | Backend lo envía después de OAuth | ✅ XSS safe |
| **localStorage** | User (email, id, name) | JavaScript necesita acceso para renderizar | ⚠️ Solo datos públicos |
| **Memoria Navegador** | Session | Automático con credentials: 'include' | ✅ Manejado por navegador |

---

## 🐛 Debugging

### Consola del Navegador
Los logs muestran exactamente qué está pasando:

```javascript
// En /auth/success
"🔄 AuthSuccess: INICIANDO FLUJO OAUTH"
"🔐 GET PROFILE - Con Cookie httpOnly (Seguro)"
"📡 Endpoint: /auth/me"
"✓ ÉXITO - Cookie httpOnly fue validada"

// En useAuth hook
"🔐 useAuth - INICIALIZANDO AUTENTICACIÓN"
"✓ Usando usuario guardado de localStorage"
```

### DevTools
```
Network → GET /auth/me
  Request Headers:
    - Content-Type: application/json
    - Cookie: accessToken=eyJ...  ← La cookie se envía aquí
  
  Response:
    - Status: 200 OK
    - Body: { id: 1, email: "user@test.com", ... }
```

### Página de Debug
`/debug` → Botón "Test GET /auth/me" muestra:
```
📡 CREDENCIALES ENVIADAS A /auth/me
═══════════════════════════════════════════════
🌐 URL: GET http://localhost:3000/auth/me
📋 Mode: credentials: 'include'

📊 HEADERS:
  Content-Type: application/json
  Authorization: Bearer [si existe]

🍪 COOKIES:
  accessToken: [enviada automáticamente]
```

---

## ⚠️ Posibles Problemas y Soluciones

### Problema: "Redirige al dashboard y luego al login rápidamente"
**Causa:** La cookie httpOnly NO se está guardando o CORS no está configurado.
**Solución:** Verificar en backend:
```javascript
// Backend DEBE tener:
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true  // ← IMPORTANTE
}));

res.cookie('accessToken', jwt, {
  httpOnly: true,   // ← IMPORTANTE
  secure: false,    // true si HTTPS
  sameSite: 'lax',  // CSRF protection
  maxAge: 3600000
});
```

### Problema: "Error 401 en /auth/me"
**Causa:** Backend no está validando la cookie correctamente.
**Solución:** Backend debe leer `req.cookies.accessToken` y validarlo.

### Problema: "Cookie no aparece en DevTools"
**No es un problema.** Si tiene `HttpOnly: ✓`, entonces es normal que no aparezca.
Aparece en DevTools → Application → Cookies, pero no en console.

---

## 📝 Resumen de Cambios por Archivo

| Archivo | Cambio | Razón |
|---|---|---|
| `authService.ts` | Agregado método `getProfile()` con credentials: 'include' | Obtener usuario usando cookie httpOnly |
| `use-auth.tsx` | Cambio lógica de inicialización | Priorizar usuario guardado sobre token |
| `auth/success/page.tsx` | Agregado logs detallados | Debuguear flujo OAuth |
| `auth/error/page.tsx` | Agregada sección de credenciales | Mostrar qué se envió cuando hay error |
| `debug/page.tsx` | Mejorado test de /auth/me | Visualizar credenciales antes de enviar |

---

## 🔐 Seguridad Implementada

### ✅ Cookie httpOnly
```
✅ JavaScript NO puede acceder (previene XSS)
✅ Solo el navegador la envía automáticamente
✅ No se expone en localStorage
✅ Validada en cada request del backend
```

### ✅ Flujo Seguro Completo
```
✅ Token jamás se ve en la consola (está seguro)
✅ No hay riesgo de exposición en localStorage
✅ CORS valida el origen correcto
✅ SameSite previene CSRF attacks
✅ En HTTPS, secure flag previene man-in-the-middle
```

### ✅ Datos Almacenados
| Ubicación | Qué | Seguridad |
|---|---|---|
| Cookie httpOnly | JWT Token | ✅ XSS proof - JavaScript NO accede |
| localStorage | User data (email, id, name) | ⚠️ Solo datos públicos |
| Memoria Navegador | Session | ✅ Manejado automáticamente por navegador |

---

## 🐛 Debugging y Logs

### Logs en Consola
El código incluye logs detallados que te muestran exactamente qué está pasando:

```javascript
// En /auth/success
═══════════════════════════════════════════════
🔄 AUTH SUCCESS - INICIANDO FLUJO
═══════════════════════════════════════════════
📡 Paso 1: Obteniendo perfil con cookie...
🔐 GET PROFILE - Obteniendo usuario
📡 Endpoint: GET /auth/me
🍪 Modo: credentials: "include"
✅ Cookie httpOnly validada correctamente
👤 Usuario: user@example.com
💾 Usuario guardado en localStorage
✓ Paso 2: Autenticación exitosa
📍 Paso 3: Redirigiendo a dashboard...
```

### DevTools Network Tab
```
1. Abre DevTools (F12)
2. Ir a Network tab
3. Hacer login con Google
4. Buscar request: GET /auth/me

Verificar:
✅ Status: 200 OK
✅ Request Headers:
   - Content-Type: application/json
   - Cookie: accessToken=eyJ... ← Cookie se envía automáticamente
✅ Response Headers:
   - Access-Control-Allow-Credentials: true
   - Access-Control-Allow-Origin: http://localhost:3000
✅ Response Body:
   { "id": 123, "email": "user@example.com", ... }
```

### Verificar Cookie en DevTools
```
1. DevTools → Application tab
2. Cookies → http://localhost:3000
3. Buscar "accessToken"

Debería ver:
✅ Name: accessToken
✅ Value: eyJ0eXAiOiJKV1QiLCJhbGc...
✅ HttpOnly: ✓ (checkbox marcado)
✅ Secure: (vacío en desarrollo, ✓ en producción)
✅ SameSite: Lax
✅ Expiry: [timestamp futuro]
```

---

## ⚠️ Troubleshooting

### Problema: "Redirige a login infinitamente"
**Síntomas:**
- Haces login con Google
- Te lleva a /auth/success
- Luego a /dashboard
- Pero vuelve a /login

**Posibles Causas:**
1. Backend no genera cookie httpOnly
2. CORS no configurado con `credentials: true`
3. Cookie no se está guardando en el navegador

**Solución:**
```bash
# 1. Verifica CORS en backend
curl -i -X OPTIONS http://localhost:5000/auth/me \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET"

# Debería ver:
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Origin: http://localhost:3000

# 2. Verifica que cookie se crea
# DevTools → Application → Cookies
# Debería ver "accessToken" con HttpOnly: ✓

# 3. Verifica getProfile() se ejecuta
# DevTools → Console
# Debería ver logs azules "🔐 GET PROFILE..."
```

### Problema: "Error 401 en /auth/me"
**Síntomas:**
- Haces login
- Console muestra: "❌ Error: Auth error: 401"
- No se guarda usuario en localStorage

**Posibles Causas:**
1. Backend no lee cookie correctamente
2. Backend no valida JWT
3. JWT expiró

**Solución:**
```bash
# Test manual de /auth/me
# 1. Haz login para obtener cookie
# 2. En DevTools → Application → Cookies, copia el valor de accessToken
# 3. Ejecuta en terminal:

curl http://localhost:5000/auth/me \
  -H "Cookie: accessToken=<PEGA_AQUI_EL_VALOR>"

# Debería retornar 200 con datos del usuario
```

### Problema: "Cookie no aparece en DevTools"
**Síntoma:**
- DevTools → Application → Cookies está vacío
- Pero GET /auth/me funciona?

**Respuesta:**
No es un problema. Si `HttpOnly: ✓`, entonces es correcto que NO aparezca fácilmente.

**Verificación:**
```bash
# Si cookie httpOnly existe, aparecerá en este comando:
# (después de logout y login)
# DevTools → Network → GET /auth/me
# Response Headers → Set-Cookie: accessToken=...; HttpOnly

# O ejecuta en consola:
document.cookie
// Si está vacío, es correcto (httpOnly = no visible)
```

### Problema: "localStorage.user está vacío"
**Síntomas:**
- Haces login
- DevTools → Application → LocalStorage → smartpack
- "user" key no existe o está vacío

**Solución:**
```bash
# 1. Verifica logs de getProfile()
# DevTools → Console → Busca "💾 Usuario guardado en localStorage"

# 2. Si no lo ves, significa getProfile() no se ejecutó
# Verifica que /auth/success se cargó

# 3. Si getProfile() retornó error 401:
# Revisa "Problema: Error 401 en /auth/me" arriba
```

---

## 📋 Checklist de Implementación

### Backend
- [ ] CORS configurado con `credentials: true`
- [ ] POST `/auth/logout` limpia cookie
- [ ] GET `/auth/me` valida JWT desde cookie httpOnly
- [ ] Endpoint OAuth (`/auth/oauth/google`) genera cookie httpOnly
- [ ] Todos los endpoints retornan `Access-Control-Allow-Credentials: true`

### Frontend
- [ ] `authService.ts` con método `getProfile()` usando `credentials: 'include'`
- [ ] `use-auth.tsx` hook con AuthProvider
- [ ] `app/login/page.tsx` con botón Google
- [ ] `app/(auth)/auth/success/page.tsx` que redirige
- [ ] `app/(auth)/auth/error/page.tsx` para mostrar errores
- [ ] `app/(dashboard)/layout.tsx` con protección
- [ ] `app/providers.tsx` con AuthProvider

### Testing
- [ ] Login con Google funciona
- [ ] Después del login, usuario está en localStorage
- [ ] Recarga la página → usuario sigue ahí
- [ ] Logout limpia localStorage
- [ ] Intenta acceder a /dashboard sin auth → redirige a /login
- [ ] DevTools → Network → GET /auth/me → Status 200

---

## 🚀 Próximos Pasos

1. **Backend:** Implementar los endpoints si no están listos
2. **Frontend:** Crear los archivos paso a paso
3. **Testing:** Seguir el checklist de implementación
4. **Debugging:** Si hay problemas, consultar la sección Troubleshooting

---

## 📚 Recursos Útiles

### Documentación
- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [MDN: Fetch API credentials](https://developer.mozilla.org/en-US/docs/Web/API/fetch#credentials)
- [OWASP: Session Security](https://owasp.org/www-community/attacks/csrf)

### Testing
- [Postman Collection](./postman_collection.json) - Incluye requests de prueba
- DevTools Network tab - Ver requests/responses en tiempo real
- DevTools Console - Ver logs detallados de cada paso

---

## 📞 Soporte

Si algo no funciona:

1. **Verifica los logs** → Console debería mostrar qué pasó
2. **Revisa DevTools Network** → Verifica status y headers
3. **Consulta Troubleshooting** → La mayoría de problemas están ahí
4. **Pregunta al backend team** → Verifica que sus endpoints estén funcionando

---

*Documento actualizado: 3 de Diciembre, 2025*
*Proyecto: smartpack-frontend*
*Rama: main*

---

## 🤖 Prompt para Claude

Si necesitas ayuda de Claude para implementar esto, usa este prompt:

```
Necesito implementar autenticación OAuth con Google y cookies httpOnly en mi proyecto Next.js.

CONTEXTO:
- Frontend: Next.js 14+ en d:\Proyectos\eki-project\smartpack-frontend
- Backend: Node.js/Express en http://localhost:5000
- Ya tengo CORS configurado con credentials: true
- Ya tengo endpoint GET /auth/me que valida JWT desde cookie httpOnly
- Ya tengo endpoint POST /auth/logout que limpia cookie

TAREAS:
1. Crear `src/infrastructure/services/authService.ts` con:
   - Método getProfile() que hace GET /auth/me con credentials: 'include'
   - Método logout() que hace POST /auth/logout con credentials: 'include'
   - Logs detallados en cada paso

2. Crear `src/hooks/use-auth.tsx` con:
   - AuthContext y AuthProvider
   - Hook useAuth() que retorna { user, loading, isAuthenticated, logout }
   - Lógica: priorizar usuario de localStorage, sino obtener con getProfile()

3. Actualizar `app/providers.tsx`:
   - Envolver todo con AuthProvider

4. Crear `app/login/page.tsx`:
   - Botón "Continuar con Google" que redirige a backend OAuth
   - Formulario bonito centrado

5. Crear `app/(auth)/auth/success/page.tsx`:
   - useEffect que llama authService.getProfile()
   - Redirige a /dashboard si éxito
   - Redirige a /auth/error si falla

6. Crear `app/(auth)/auth/error/page.tsx`:
   - Mostrar mensaje de error
   - Botón para volver a intentar

7. Crear/Actualizar `app/(dashboard)/layout.tsx`:
   - useEffect que redirige a /login si no está autenticado
   - useAuth() para obtener usuario
   - Navbars/layouts que muestren usuario

REQUISITOS:
- Usar TypeScript strictamente
- Agregar logs console.log para debugging
- Las cookies httpOnly NO deben ser accesibles desde JavaScript
- localStorage solo guarda datos públicos del usuario (email, id, nombre)
- credentials: 'include' en TODOS los fetch que necesiten la cookie
- Componentes con 'use client' donde sea necesario

IMPORTANTE:
- NO guardar el JWT token en localStorage (está en cookie httpOnly)
- El navegador envía la cookie automáticamente si usas credentials: 'include'
- El backend valida el JWT desde la cookie, no desde headers

Implementa esto completo y funcionando.
```

---

✅ **Checklist Final:**
- [ ] Leído y entendido todo el documento
- [ ] Backend está implementado y testado
- [ ] Completé los 7 pasos de implementación frontend
- [ ] Los logs en console muestran el flujo correcto
- [ ] Login → Google Auth → Dashboard funciona
- [ ] Recarga la página → Usuario sigue autenticado
- [ ] Logout → localStorage se limpia
- [ ] /dashboard está protegido (sin login → redirige a /login)
