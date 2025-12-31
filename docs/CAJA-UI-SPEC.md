# Especificación de Actualización - Componentes UI del Módulo CAJA

## ✅ YA COMPLETADO (Backend + Dominio + Hooks)

- Entidad Box con campos reales
- ApiBoxRepository conectado
- Todos los use cases
- Todos los hooks de React Query
- Schemas de validación actualizados

---

## 🔄 PENDIENTE: Actualizar Componentes UI

### 1️⃣ BoxForm.tsx

**Campos ACTUALES (ficticios):**
- `code` (text input)
- `description` (textarea)
- `type` (select: ESTANDAR/ESPECIAL/REFRIGERADO)
- `status` (select)
- `unitCost` (number)
- `currency` (select: CLP/USD/EUR)

**Campos REALES que debe tener:**
- `qrCode` (text input, **readonly en modo edit**, validación: solo alfanuméricos y guiones)
- `description` (textarea, opcional, max 500 chars)
- `type` (select: PEQUEÑA | NORMAL | GRANDE)
- `currentWeightKg` (number input, min 0, max 10000)
- `warehouseId` (select, obligatorio, debe cargar lista de bodegas)
- `status` (select: ACTIVA | INACTIVA | EN_USO, default ACTIVA)

**Cambios:**
- Eliminar `unitCost` y `currency` completamente
- Cambiar `code` → `qrCode` con validación regex `/^[A-Za-z0-9_-]+$/`
- Agregar campo `warehouseId` con select de bodegas (usar `useWarehouses()`)
- En modo edición: `qrCode` debe ser **readonly** y **disabled**
- Actualizar enums de type: PEQUEÑA, NORMAL, GRANDE
- Actualizar enums de status: ACTIVA, INACTIVA, EN_USO

---

### 2️⃣ BoxDialog.tsx

**Requiere cambios mínimos:**
- Ya es solo un wrapper del BoxForm
- Asegurarse de que pase correctamente el `mode` (create/edit)
- Los títulos/descripciones están OK

---

### 3️⃣ BoxesView.tsx

**Funcionalidad ACTUAL:**
- Muestra listado de cajas en grid de cards
- Botón "Nueva Caja"
- Cada card muestra: code, description, type, unitCost+currency, status
- Acciones: Ver detalle, Editar

**Funcionalidad REAL que debe tener:**
- ✅ Listado en grid (mantener)
- ✅ Botón "Nueva Caja" (mantener)
- **AGREGAR:** Input de búsqueda por qrCode
- **AGREGAR:** Filtro por status (dropdown: Todas/ACTIVA/INACTIVA/EN_USO)
- **AGREGAR:** Paginación (botones Anterior/Siguiente, mostrar total)
- **CAMBIAR:** Cada card debe mostrar:
  - `qrCode` (en lugar de code)
  - `description` (si existe)
  - `type` (PEQUEÑA/NORMAL/GRANDE)
  - `currentWeightKg` kg (en lugar de unitCost+currency)
  - `warehouse.name` (si viene en la respuesta)
  - `status`
- **AGREGAR:** Componente de búsqueda rápida por QR (input + botón "Buscar QR" que redirija al detalle si encuentra)

**Hooks a usar:**
- `useBoxes(filters)` donde filters incluye: `{ page, limit, search, status }`
- `useFindBoxByQr()` para la búsqueda rápida

---

### 4️⃣ BoxDetailView.tsx

**Funcionalidad ACTUAL:**
- Tabs: Info General | Historial
- Info tab: muestra code, type, description, status, unitCost+currency
- Placeholder para "Inventario por Ubicación"
- Historial tab: itera `box.history` array

**Funcionalidad REAL que debe tener:**

**Tab: Info General**
- **CAMBIAR:** Mostrar qrCode (en lugar de code)
- **CAMBIAR:** Mostrar currentWeightKg kg (en lugar de unitCost+currency)
- **AGREGAR:** Mostrar warehouse.name (bodega actual)
- **MANTENER:** description, type, status
- **MANTENER:** Placeholder "Inventario por Ubicación" (funcionalidad en desarrollo)

**Tab: Historial**
- **CAMBIAR:** Usar `useBoxHistory(boxId, filters)` en lugar de `box.history` directo
- **AGREGAR:** Filtro por `eventType` (dropdown: Todos/CREATED/UPDATED/MOVED/STATUS_CHANGED/DEACTIVATED)
- **AGREGAR:** Paginación del historial
- Mostrar: timestamp, eventType, userId, description, metadata

**NUEVAS ACCIONES:**
- **Botón "Mover":** Abre modal para seleccionar nueva bodega, llama `useMoveBox()`
- **Botón "Cambiar Estado":** Abre modal para seleccionar nuevo status, llama `useChangeBoxStatus()`
- **Botón "Desactivar":** Muestra AlertDialog de confirmación, llama `useDeactivateBox()`
- Todos los botones deben estar condicionados por permisos (`can('boxes:move')`, etc.)

---

### 5️⃣ NUEVOS COMPONENTES A CREAR

#### MoveBoxDialog.tsx
- Modal con select de bodegas
- Props: `boxId`, `currentWarehouseId`, `open`, `onClose`, `onSuccess`
- Usa `useWarehouses()` para cargar bodegas
- Usa `useMoveBox()` mutation
- Toast de éxito/error

#### ChangeBoxStatusDialog.tsx
- Modal con select de status (ACTIVA | INACTIVA | EN_USO)
- Props: `boxId`, `currentStatus`, `open`, `onClose`, `onSuccess`
- Usa `useChangeBoxStatus()` mutation
- Toast de éxito/error

#### DeactivateBoxDialog.tsx
- AlertDialog de confirmación
- Props: `boxId`, `open`, `onClose`, `onSuccess`
- Mensaje: "¿Estás seguro? Esta acción desactivará la caja. Si tiene stock asignado, no podrá ser desactivada."
- Usa `useDeactivateBox()` mutation
- Toast de éxito/error (maneja error específico de stock > 0)

#### SearchBoxByQr.tsx (opcional, puede ir integrado en BoxesView)
- Input + botón "Buscar QR"
- Usa `useFindBoxByQr()` mutation
- Si encuentra: redirige a `/boxes/{id}`
- Si no encuentra: muestra toast "No se encontró caja con ese QR"

---

## 📋 ORDEN DE IMPLEMENTACIÓN SUGERIDO

1. **BoxForm.tsx** (crítico, afecta creación/edición)
2. **BoxesView.tsx** (listado con filtros)
3. **BoxDetailView.tsx** (acciones básicas)
4. **MoveBoxDialog.tsx**, **ChangeBoxStatusDialog.tsx**, **DeactivateBoxDialog.tsx** (acciones avanzadas)
5. **SearchBoxByQr.tsx** o integrar búsqueda QR en BoxesView

---

## ⚠️ NOTAS IMPORTANTES

- **qrCode es ÚNICO y NO MODIFICABLE:** Backend rechazará cambios, frontend debe prevenirlo con `readonly` + `disabled`
- **Manejo de errores específicos:**
  - 409 Conflict → qrCode duplicado
  - 400 capacidad → bodega sin capacidad
  - 400 stock → caja con stock no se puede desactivar
- **Permisos:** Respetar `can('boxes:create')`, `can('boxes:edit')`, `can('boxes:move')`, `can('boxes:deactivate')`
- **Paginación por defecto:** `page=1`, `limit=10` (ajustar según UX)
- **Toast obligatorios:** Éxito (✅) y Error (❌) en todas las mutations
- **Invalidación de caché:** Ya está manejada en los hooks

---

## 🎯 CAMPOS Y ENDPOINTS REALES DEL BACKEND (REFERENCIA)

**GET /boxes?page=1&limit=10&search=BOX-001&status=ACTIVA**
Retorna:
```json
{
  "data": [
    {
      "id": "uuid",
      "qrCode": "BOX-001",
      "description": "Caja para herramientas",
      "type": "NORMAL",
      "currentWeightKg": 25.5,
      "status": "ACTIVA",
      "warehouseId": "uuid",
      "warehouse": { "id": "uuid", "name": "Bodega Central", "capacityKg": 1000 },
      "tenantId": "kreatech-demo",
      "createdAt": "2025-01-01T10:00:00Z",
      "updatedAt": "2025-01-15T12:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

**POST /boxes**
Body:
```json
{
  "qrCode": "BOX-NEW-001",
  "description": "Caja nueva",
  "type": "PEQUEÑA",
  "currentWeightKg": 10.0,
  "warehouseId": "uuid"
}
```

**PATCH /boxes/{id}**
Body (solo campos a cambiar):
```json
{
  "description": "Descripción actualizada",
  "type": "GRANDE",
  "currentWeightKg": 50.0,
  "status": "ACTIVA"
}
```

**PATCH /boxes/{id}/move**
Body:
```json
{
  "warehouseId": "nuevo-uuid"
}
```

**PATCH /boxes/{id}/status**
Body:
```json
{
  "status": "INACTIVA"
}
```

**PATCH /boxes/{id}/deactivate**
Body: `{}` (vacío)

**GET /boxes/qr/{qrCode}**
Retorna: misma estructura que GET /boxes/{id}

**GET /boxes/{id}/history?page=1&limit=10&eventType=MOVED**
Retorna:
```json
{
  "data": [
    {
      "id": "uuid",
      "boxId": "uuid",
      "eventType": "MOVED",
      "timestamp": "2025-01-15T12:30:00Z",
      "userId": "uuid",
      "description": "Caja movida de Bodega A a Bodega B",
      "metadata": { "from": "Bodega A", "to": "Bodega B" },
      "createdAt": "2025-01-15T12:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```
