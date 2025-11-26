# 📋 Notas de Integración Backend - Frontend

## Estado Actual: Usando Repositorios Mock

El frontend está actualmente usando **MockRepositories** para simular las operaciones del backend. Para integrar con el backend real, se requieren los siguientes ajustes:

---

## ✅ Endpoints que YA EXISTEN en el Backend

### **Autenticación**
- ✅ `POST /auth/register` - Registro de usuarios
- ✅ `POST /auth/login` - Login (devuelve `accessToken`)
- ✅ `GET /users/me` - Perfil del usuario autenticado

### **Usuarios**
- ✅ `POST /users` - Crear usuario
- ✅ `GET /users` - Listar todos los usuarios
- ✅ `GET /users/{id}` - Obtener usuario por ID
- ✅ `PUT /users/{id}` - Actualizar usuario
- ✅ `DELETE /users/{id}` - Eliminar/deshabilitar usuario

### **Roles**
- ✅ `GET /roles` - Listar roles disponibles

### **Áreas**
- ✅ `POST /areas` - Crear área
- ✅ `GET /areas` - Listar áreas
- ✅ `GET /areas/{id}` - Obtener área por ID
- ✅ `PUT /areas/{id}` - Actualizar área

### **Asignaciones** ✅ IMPLEMENTADO EN FRONTEND
- ✅ `POST /areas/{areaId}/managers` - Asignar jefe a área
  - **Body:** `{ managerId: string }`
  - **Uso:** Al crear/editar usuario con rol JEFE
- ✅ `POST /areas/{areaId}/warehouses` - Vincular bodega a área
  - **Body:** `{ warehouseId: string }`
- ✅ `POST /warehouses/{warehouseId}/supervisors` - Asignar supervisor a bodega
  - **Body:** `{ supervisorId: string }`
  - **Uso:** Al crear/editar usuario con rol SUPERVISOR

**Integración en Frontend:** `ApiUserRepository` procesa automáticamente las asignaciones después de crear/actualizar un usuario según su rol.

---

## ❌ Endpoints FALTANTES en el Backend

Estos endpoints son necesarios para las funcionalidades implementadas en el frontend:

### **1. Validación de Email Único**
```http
GET /users/check-email?email={email}&excludeUserId={userId?}
Response: { exists: boolean }
```
**Ubicación en Frontend:** `MockUserRepository.checkEmailExists()`  
**Uso:** Validación en tiempo real en `UserForm` al crear/editar usuarios

---

### **2. Gestión de Contraseñas**

#### Verificar contraseña actual
```http
POST /users/{id}/verify-password
Headers: Authorization: Bearer {token}
Body: { password: string }
Response: { valid: boolean }
```
**Ubicación en Frontend:** `MockUserRepository.verifyPassword()`  
**Uso:** `ChangePasswordDialog` para validar contraseña actual antes de cambiar

#### Cambiar contraseña
```http
PUT /users/{id}/change-password
Headers: Authorization: Bearer {token}
Body: { newPassword: string }
Response: void
```
**Ubicación en Frontend:** `MockUserRepository.changePassword()`  
**Uso:** `ChangePasswordDialog` para actualizar contraseña

---

### **3. Historial de Asignaciones**

#### Obtener historial de un usuario
```http
GET /assignment-history/user/{userId}
Headers: Authorization: Bearer {token}
Response: AssignmentHistoryEntry[]
```

#### Crear entrada de historial
```http
POST /assignment-history
Headers: Authorization: Bearer {token}
Body: {
  userId: string;
  entityId: string;
  entityName: string;
  entityType: "AREA" | "WAREHOUSE";
  action: "ASSIGNED" | "REMOVED";
  performedBy: string;
  performedByName: string;
  timestamp: Date;
  tenantId: string;
}
Response: AssignmentHistoryEntry
```

#### Obtener historial reciente
```http
GET /assignment-history/recent?limit={number}
Headers: Authorization: Bearer {token}
Response: AssignmentHistoryEntry[]
```

**Ubicación en Frontend:** `MockAssignmentHistoryRepository`  
**Uso:** 
- `AssignmentHistoryView` - Visualizar timeline de cambios
- `UsersView.handleCreate/handleUpdate` - Logging automático de cambios

**Modelo de datos:**
```typescript
interface AssignmentHistoryEntry {
  id: string;
  userId: string;
  entityId: string;
  entityName: string;
  entityType: "AREA" | "WAREHOUSE";
  action: "ASSIGNED" | "REMOVED";
  performedBy: string;
  performedByName: string;
  timestamp: Date;
  tenantId: string;
}
```

---

### **4. Gestión de Bodegas (Warehouses)**

```http
GET /warehouses
Headers: Authorization: Bearer {token}
Response: Warehouse[]

GET /warehouses/{id}
Headers: Authorization: Bearer {token}
Response: Warehouse

GET /warehouses?areaId={areaId}
Headers: Authorization: Bearer {token}
Response: Warehouse[]
```

**Ubicación en Frontend:** `MockWarehouseRepository`  
**Uso:** 
- `UserForm` - MultiSelect para asignar bodegas
- `UsersView` - Mostrar nombres de bodegas en badges

---

## ⚠️ Diferencias en Modelos de Datos

### **Usuario - Campos**

El backend actualmente usa `firstName` pero el frontend espera `name`:

```typescript
// Backend (actual)
{
  firstName: string;
  lastName: string;
}

// Frontend (esperado)
{
  name: string;
  lastName: string;
}
```

**Solución:** El backend debe mapear `firstName → name` en las respuestas, o el frontend debe crear un adapter.

---

### **Usuario - Asignaciones**

El frontend espera que el modelo `User` incluya:

```typescript
{
  areas: string[];        // Array de IDs de áreas
  warehouses: string[];   // Array de IDs de bodegas
}
```

**Estado actual del backend:**
- Usa tablas de relación: `area_managers`, `area_warehouses`, `warehouse_supervisors`
- NO devuelve `areas[]` y `warehouses[]` directamente en el modelo User

**Soluciones posibles:**

#### Opción 1: Backend agrega campos al modelo User
```typescript
GET /users/{id}
Response: {
  ...campos actuales,
  areas: string[];        // IDs de áreas donde es manager
  warehouses: string[];   // IDs de bodegas donde es supervisor
}
```

#### Opción 2: Frontend consulta asignaciones por separado
```http
GET /users/{id}/areas → string[]
GET /users/{id}/warehouses → string[]
```

**Recomendación:** Opción 1 es más eficiente (menos requests HTTP)

---

## 🔄 Plan de Migración de Mock a Backend Real

### **Fase 1: Implementar Endpoints Faltantes**
1. Crear endpoint de validación de email
2. Crear endpoints de gestión de contraseñas
3. Crear módulo de historial de asignaciones
4. Crear endpoints de bodegas (si no existen)

### **Fase 2: Ajustar Modelo User**
1. Agregar campos `areas[]` y `warehouses[]` al DTO de User
2. Poblar estos campos desde las relaciones en el backend
3. Mapear `firstName → name` en las respuestas

### **Fase 3: Crear Repositorios Reales**
1. Crear `ApiUserRepository` que reemplace `MockUserRepository`
2. Crear `ApiAreaRepository` que reemplace `MockAreaRepository`
3. Crear `ApiWarehouseRepository` que reemplace `MockWarehouseRepository`
4. Crear `ApiAssignmentHistoryRepository`

### **Fase 4: Actualizar RepositoryProvider**
```typescript
// Cambiar de:
userRepo: new MockUserRepository()

// A:
userRepo: new ApiUserRepository()
```

---

## 🔐 Consideraciones de Seguridad

### **1. Validación de Jerarquías en Backend**

El frontend implementa restricciones de roles:
- **ADMIN**: Crea cualquier rol
- **JEFE**: Solo crea SUPERVISOR, solo ve sus áreas
- **SUPERVISOR**: No crea usuarios

**El backend DEBE validar estas reglas también** en:
- `POST /users` - Validar que el rol creado está permitido
- `GET /users` - Filtrar usuarios según jerarquía del solicitante
- `PUT /users` - Validar cambios de rol

### **2. Tenant Isolation**

Todos los endpoints deben filtrar por `tenantId` del usuario autenticado:
```typescript
// Obtener tenantId del JWT token
const tenantId = user.tenantId;

// Filtrar todas las queries
WHERE tenantId = :tenantId
```

### **3. Hashing de Contraseñas**

- Usar **bcrypt** o **argon2** para hashear contraseñas
- Validar contraseña actual antes de permitir cambio
- Aplicar políticas de contraseñas (mínimo 8 caracteres, etc.)

---

## 📊 Ejemplo de Flujo Completo

### **Crear Usuario con Asignaciones**

**Frontend:**
```typescript
1. Usuario llena formulario en UserForm
2. Selecciona áreas: ['area-1', 'area-2']
3. Selecciona bodegas: ['warehouse-1']
4. Submit → UsersView.handleCreate()
```

**Backend esperado:**
```http
POST /users
Body: {
  email: "nuevo@example.com",
  password: "hashed",
  name: "Nuevo",
  lastName: "Usuario",
  rut: "12345678-9",
  phone: "+56912345678",
  roleId: "role-uuid",
  areas: ["area-1", "area-2"],
  warehouses: ["warehouse-1"],
  tenantId: "tenant-uuid"
}

Response: User (con areas[] y warehouses[] populados)
```

**Frontend después de crear:**
```typescript
1. LogAssignmentChange registra historial
2. POST /assignment-history (3 entradas):
   - { entityType: "AREA", action: "ASSIGNED", entityId: "area-1" }
   - { entityType: "AREA", action: "ASSIGNED", entityId: "area-2" }
   - { entityType: "WAREHOUSE", action: "ASSIGNED", entityId: "warehouse-1" }
```

---

## 🎯 Checklist de Integración

- [ ] Implementar `GET /users/check-email`
- [ ] Implementar `POST /users/{id}/verify-password`
- [ ] Implementar `PUT /users/{id}/change-password`
- [ ] Crear módulo de historial de asignaciones
  - [ ] `GET /assignment-history/user/{userId}`
  - [ ] `POST /assignment-history`
  - [ ] `GET /assignment-history/recent`
- [ ] Implementar endpoints de bodegas
  - [ ] `GET /warehouses`
  - [ ] `GET /warehouses/{id}`
  - [ ] `GET /warehouses?areaId={areaId}`
- [ ] Agregar campos `areas[]` y `warehouses[]` al modelo User
- [ ] Mapear `firstName → name` en respuestas de User
- [ ] Validar jerarquías de roles en backend
- [ ] Implementar tenant isolation en todas las queries
- [ ] Crear ApiRepositories para reemplazar Mocks
- [ ] Actualizar RepositoryProvider con repos reales
- [ ] Testing de integración end-to-end

---

## 📞 Contacto

Para dudas sobre la implementación frontend o estructura esperada de datos, revisar:
- `src/infrastructure/repositories/Mock*.ts` - Contratos de los repositorios
- `src/domain/entities/*.ts` - Modelos de dominio
- `src/shared/schemas/index.ts` - Validaciones Zod
