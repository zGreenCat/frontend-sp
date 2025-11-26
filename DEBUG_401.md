# 🐛 Solución Error 401 Unauthorized

## Problema
Al hacer login exitoso en Postman funciona, pero en el frontend aparece error 401 al intentar acceder a `/users`.

## Causa Probable
El backend está devolviendo el token con una clave diferente a la esperada (ej: `access_token` en vez de `token`).

## ✅ Solución Implementada

He actualizado el código para:
1. Detectar automáticamente diferentes formatos de respuesta del backend
2. Agregar logs detallados para debugging
3. Crear herramientas de debugging en consola

## 🔍 Cómo Debuggear

### Paso 1: Abrir DevTools
1. Presiona `F12` o `Ctrl+Shift+I`
2. Ve a la pestaña **Console**

### Paso 2: Hacer Login
1. Ingresa a `http://localhost:3001/login`
2. Ingresa tus credenciales
3. **Observa los logs en la consola**:
   ```
   📤 Login request to: /auth/login
   📥 Login response structure: { ... }
   ✅ Token extracted successfully: ...
   ```

### Paso 3: Usar Herramientas de Debug
En la consola del navegador, ejecuta:

```javascript
// Ver toda la información de autenticación
authDebug.all()

// Ver solo el token
authDebug.token()

// Ver solo el usuario
authDebug.user()

// Probar un request a /users
authDebug.test()

// Limpiar autenticación (si necesitas empezar de nuevo)
authDebug.clear()
```

### Paso 4: Verificar Token en Network Tab
1. Ve a la pestaña **Network** en DevTools
2. Filtra por `Fetch/XHR`
3. Haz click en el request a `/users`
4. En la pestaña **Headers**, busca:
   - **Request Headers** → `Authorization: Bearer ...`
   - Verifica que el token esté presente

## 🔧 Posibles Problemas y Soluciones

### Problema 1: El backend devuelve `access_token` en lugar de `token`
**Síntoma**: En los logs ves que `response.token` es undefined pero existe `response.access_token`

**Solución**: ✅ Ya implementado. El código ahora busca automáticamente:
- `response.token`
- `response.access_token`
- `response.accessToken`

### Problema 2: Token no se guarda en localStorage
**Síntoma**: `authDebug.token()` muestra "No token found"

**Verificar**:
```javascript
// En la consola
console.log(localStorage.getItem('token'))
```

**Solución**: 
- Verifica que el login se complete sin errores
- Revisa los logs de la consola durante el login
- Si es necesario, usa `authDebug.clear()` y vuelve a hacer login

### Problema 3: Token guardado pero no se envía
**Síntoma**: Token existe en localStorage pero request va sin Authorization header

**Verificar en código**:
```javascript
// Busca este log en la consola
🔐 Token being used: ...
```

**Solución**: El código ya imprime warnings si no encuentra token cuando debería.

### Problema 4: Backend rechaza el token
**Síntoma**: Token se envía pero backend responde 401

**Posibles causas**:
1. Token expirado
2. Token de otro tenant/ambiente
3. Backend espera formato diferente de Authorization header
4. CORS issues

**Verificar**:
```javascript
// En la consola
authDebug.token()  // Mira la expiración
authDebug.test()   // Prueba el request directamente
```

## 📋 Checklist de Debugging

1. [ ] Login funciona (no hay errores en consola)
2. [ ] Se ven los logs `📤 Login request` y `📥 Login response`
3. [ ] `authDebug.token()` muestra un token válido
4. [ ] `authDebug.user()` muestra datos del usuario
5. [ ] En Network tab, request a `/users` tiene header `Authorization`
6. [ ] Token no está expirado (ver `authDebug.token()`)
7. [ ] `authDebug.test()` funciona correctamente

## 🧪 Test Manual

Ejecuta esto en la consola después de hacer login:

```javascript
// Test completo
(async () => {
  console.log('=== INICIANDO TEST ===');
  
  // 1. Verificar token
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No hay token guardado');
    return;
  }
  console.log('✅ Token encontrado:', token.substring(0, 20) + '...');
  
  // 2. Probar request
  try {
    const response = await fetch('http://localhost:3000/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Users:', data);
    } else {
      const error = await response.text();
      console.error('❌ FAILED:', error);
    }
  } catch (e) {
    console.error('❌ ERROR:', e);
  }
})();
```

## 📞 Si Nada Funciona

Comparte el output de estos comandos:

```javascript
// 1. Info completa
authDebug.all()

// 2. Test de request
authDebug.test()

// 3. Headers del request
// (Ve a Network tab → Click en request /users → Headers)
```

## 🔄 Limpiar y Reintentar

Si todo falla:

```javascript
// 1. Limpiar autenticación
authDebug.clear()

// 2. Recarga la página
location.reload()

// 3. Hacer login de nuevo

// 4. Verificar
authDebug.all()
```
