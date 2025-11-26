# Integración con Backend - Guía de Pruebas

## ✅ Módulos Conectados

Los siguientes módulos ya están conectados al backend real:

- **Users (Usuarios)**: CRUD completo + autenticación
- **Areas**: CRUD completo
- **Warehouses (Bodegas)**: Estructura lista (pendiente endpoints backend)
- **Assignment History**: Estructura lista (pendiente endpoints backend)

## 🔧 Configuración

1. **Crear archivo `.env.local`** (ya creado):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

2. **Asegurar que el backend esté corriendo** en `http://localhost:3000`

3. **Endpoints requeridos por el frontend**:

### ✅ Endpoints Existentes (Funcionan)
- `POST /auth/login` - Login
- `POST /auth/register` - Registro
- `GET /users/me` - Usuario actual
- `GET /users` - Listar usuarios
- `GET /users/:id` - Usuario por ID
- `POST /users` - Crear usuario
- `PUT /users/:id` - Actualizar usuario
- `DELETE /users/:id` - Eliminar usuario
- `GET /areas` - Listar áreas
- `GET /areas/:id` - Área por ID
- `POST /areas` - Crear área
- `PUT /areas/:id` - Actualizar área
- `GET /roles` - Listar roles

### ⚠️ Endpoints Pendientes (Backend debe implementar)
- `GET /users/check-email?email={email}&excludeUserId={id}` - Validar email único
- `POST /users/:id/verify-password` - Verificar contraseña actual
- `PUT /users/:id/change-password` - Cambiar contraseña
- `GET /warehouses` - Listar bodegas
- `GET /warehouses/:id` - Bodega por ID
- `POST /warehouses` - Crear bodega
- `PUT /warehouses/:id` - Actualizar bodega
- `GET /assignment-history/user/:userId` - Historial de usuario
- `POST /assignment-history` - Crear entrada de historial
- `GET /assignment-history/recent?limit={n}` - Historial reciente

## 🔄 Mapeo de Datos

### User (Usuario)
**Backend → Frontend:**
- `firstName` → `name`
- `roleId` → resuelto a `role.name` (ADMIN/JEFE/SUPERVISOR)
- `role` objeto incluido en respuesta

**Frontend → Backend:**
- `name` → `firstName`
- `role` (nombre) → `roleId` (resuelto vía `/roles` endpoint)

### Area
**Backend → Frontend:**
- `level` como `number` (1, 2, 3...)
- `status` como string ('ACTIVO'/'INACTIVO')

### Warehouse (Bodega)
**Backend → Frontend:**
- `capacityKg` como `number`
- `status` como string ('ACTIVO'/'INACTIVO')

## 🧪 Pruebas

### 1. Probar Login
```typescript
// Navegar a /login
// Ingresar credenciales válidas del backend
// Verificar redirección a /dashboard
```

### 2. Probar Gestión de Usuarios
```typescript
// Navegar a /users
// Verificar que se carguen usuarios del backend
// Crear nuevo usuario
// Editar usuario existente
// Verificar que los cambios persistan
```

### 3. Probar Áreas
```typescript
// Navegar a /areas
// Verificar que se carguen áreas del backend
// Crear nueva área
// Editar área existente
```

## ⚠️ Limitaciones Actuales

1. **Warehouses (Bodegas)**: 
   - Endpoints no implementados en backend
   - El repositorio retorna arrays vacíos
   - Crear/actualizar lanzará error

2. **Assignment History**:
   - Endpoints no implementados en backend
   - El historial no se guardará
   - La timeline mostrará vacío

3. **Validación de Email Único**:
   - Sin endpoint dedicado
   - Workaround: obtiene todos los usuarios y valida en cliente
   - Puede ser lento con muchos usuarios

4. **Gestión de Contraseñas**:
   - Cambiar contraseña no funciona (endpoint pendiente)
   - Verificar contraseña siempre retorna `true`

5. **Areas/Warehouses en User**:
   - Backend no retorna arrays `areas[]` y `warehouses[]`
   - Por ahora se muestran como arrays vacíos
   - Asignaciones no persisten

## 🔐 Autenticación

El sistema usa Bearer Token:
- Token se guarda en `localStorage.getItem('token')`
- Usuario se guarda en `localStorage.getItem('user')`
- Token se incluye en header: `Authorization: Bearer {token}`

## 🐛 Debugging

### Ver requests en Network tab:
1. Abrir DevTools (F12)
2. Ir a Network tab
3. Filtrar por `Fetch/XHR`
4. Realizar acciones en la app
5. Ver requests/responses

### Logs en consola:
Los repositorios API tienen `console.error()` para errores y `console.warn()` para endpoints pendientes.

### Verificar token:
```javascript
console.log(localStorage.getItem('token'))
console.log(localStorage.getItem('user'))
```

## 📝 Próximos Pasos

1. **Backend**: Implementar endpoints pendientes (ver sección ⚠️)
2. **Backend**: Agregar `areas[]` y `warehouses[]` a respuesta de User
3. **Backend**: Implementar lógica de asignaciones (relaciones User-Area, User-Warehouse)
4. **Frontend**: Probar cada módulo contra backend real
5. **Frontend**: Manejar errores específicos del backend
6. **Frontend**: Implementar retry logic y caching si es necesario

## 🔄 Volver a Mock Repositories

Si necesitas volver a usar datos de prueba:

Editar `src/presentation/providers/RepositoryProvider.tsx`:
```typescript
// Cambiar de:
userRepo: new ApiUserRepository(),
areaRepo: new ApiAreaRepository(),

// A:
userRepo: new MockUserRepository(),
areaRepo: new MockAreaRepository(),
```
