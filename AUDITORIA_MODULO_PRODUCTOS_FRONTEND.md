# Auditoría Módulo Productos – Frontend SmartPack

**Fecha de Auditoría:** 30 de Enero de 2026  
**Realizado por:** Senior Frontend Developer  
**Stack Tecnológico:** Next.js 15, React 18, TypeScript, React Query, Shadcn UI  
**Arquitectura:** Clean Architecture / Hexagonal

---

## 1. Resumen General

### Estructura del Módulo de Productos

El módulo de productos en el frontend está implementado siguiendo la **Opción A** de arquitectura unificada:

#### **Entidades de Dominio**
- **Ubicación:** `src/domain/entities/Product.ts`
- **Modelo unificado:** Entidad `Product` con campo discriminador `kind: ProductKind`
- **Tipos:** `ProductKind = 'EQUIPMENT' | 'MATERIAL' | 'SPARE_PART'`
- **Campos principales:**
  - Comunes: `id`, `name`, `description`, `isActive`, `createdAt`, `updatedAt`, `currency`
  - Específicos de Equipment: `model`
  - Específicos de Material: `unitOfMeasure`, `isHazardous`, `categories[]`
  - Monetarios: `monetaryValueRaw` (sin parsear)

#### **Repositorios**
- **Interfaz:** `src/domain/repositories/IProductRepository.ts`
  - `list(params: ListProductsParams): Promise<PaginatedResponse<Product>>`
  - `findById(id: string, kind: ProductKind): Promise<Product | null>`
- **Implementación:** `src/infrastructure/repositories/ApiProductRepository.ts`
  - Actúa como **fachada unificada** sobre los endpoints reales del backend:
    - `EQUIPMENT` → `/equipment` (lista) y `/equipments/:id` (detalle)
    - `MATERIAL` → `/materials` (lista) y `/materials/:id` (detalle)
    - `SPARE_PART` → `/spare-parts` (lista) y `/spare-parts/:id` (detalle)
  - Realiza mapeo de DTOs del backend a entidad `Product`

#### **Casos de Uso**
- **Ubicación:** `src/application/usecases/product/`
- **Casos implementados:**
  - `ListProducts.ts` - Lista productos con filtros
  - `GetProductDetail.ts` - Obtiene detalle de un producto

#### **Hooks React Query**
- **Ubicación:** `src/hooks/useProducts.ts`
- **Hooks principales:**
  - `useProducts(params: UseProductsParams)` - Lista productos (requiere `kind`)
  - `useProductDetail(id, kind)` - Detalle de producto
- **Hooks de conveniencia (wrappers):**
  - `useEquipments(params)` - Wrapper para equipos
  - `useMaterials(params)` - Wrapper para materiales
  - `useSpareParts(params)` - Wrapper para repuestos

#### **Vistas UI**
- **Vista de listado:** `src/presentation/views/ProductsView.tsx`
  - Layout con 3 tabs (Materiales, Equipos, Repuestos)
  - Búsqueda por texto libre
  - Paginación
  - Estado de carga con spinners
- **Vista de detalle:** `src/presentation/views/ProductDetailView.tsx`
  - Ficha de información maestra
  - 3 tabs: Información General, Asociaciones, Historial
  - Botones de acción (Editar, Dar de baja) según permisos

#### **Formularios / Diálogos**
- **NO EXISTEN** formularios de creación o edición de productos
- Solo existen diálogos para seleccionar productos en el contexto de inventario de cajas:
  - `AddEquipmentDialog.tsx` - Selecciona equipos para agregar a caja
  - `AddMaterialDialog.tsx` - Selecciona materiales para agregar a caja

#### **Componente de Historial**
- **NO EXISTE** componente de historial de productos
- La vista de detalle tiene un tab "Historial" con placeholder

---

## 2. Estado por Requerimiento (ERS)

### 2.1 PROD-001 – Listar / Buscar Productos

**Estado:** `[PARTIAL]` ⚠️

#### ✅ Implementado:

1. **Paginación:**
   - Archivo: `src/presentation/views/ProductsView.tsx`
   - Implementación: Botones "Anterior/Siguiente" con estado de página
   - Variables: `pageMaterials`, `pageEquipments`, `pageSpareParts`
   - Límite fijo: `limit = 10` items por página

2. **Búsqueda por texto libre:**
   - Implementación: Input de búsqueda por tab
   - Variables: `searchMaterials`, `searchEquipments`, `searchSpareParts`
   - Búsqueda case-insensitive (manejada por backend)
   - Reinicia paginación a página 1 al buscar

3. **Visualización por tabs:**
   - 3 tabs separados: Materiales, Equipos, Repuestos
   - Cada tab usa hook específico (`useMaterials`, `useEquipments`, `useSpareParts`)

4. **Columnas visibles:**
   - **Materiales:** Nombre, Descripción, Unidad, Peligroso, Moneda, Categorías, Estado
   - **Equipos:** Nombre, Modelo, Descripción, Moneda, Estado, Fecha Creación
   - **Repuestos:** Nombre, Modelo, Descripción, Moneda, Estado, Fecha Creación

5. **Estados y errores:**
   - Loading: Spinner con `<Loader2>` centrado
   - Estado vacío: `<EmptyState>` component
   - NO hay manejo explícito de errores con toasts (falta)

#### ❌ Faltante:

1. **Columna "Código":**
   - NO se muestra en ningún tab
   - El modelo `Product` tiene campo `sku` opcional pero no se renderiza

2. **Columna "Proveedor":**
   - NO implementado
   - El modelo `Product` tiene `providerId` pero no se muestra ni se resuelve

3. **Columna "Costo unitario":**
   - Se muestra "Moneda" pero el costo dice "Valor pendiente"
   - Campo `monetaryValueRaw` no se parsea ni se muestra

4. **Columna "Fecha de última modificación":**
   - Solo se muestra "Fecha Creación" (`createdAt`)
   - NO se muestra `updatedAt`

5. **Filtros avanzados:**
   - NO hay filtro por Estado (Activo/Inactivo)
   - NO hay filtro por Proveedor
   - NO hay filtro por Proyecto
   - NO hay filtro por Moneda
   - Solo existe búsqueda por texto

6. **Filtro por defecto (solo activos):**
   - NO implementado
   - Se muestran todos los productos sin filtrar por `isActive`

7. **Toasts de error:**
   - NO hay manejo de errores en ProductsView
   - Si falla la carga, no se muestra toast rojo

8. **Botón "Crear Producto":**
   - NO existe en la vista
   - No hay forma de crear productos desde el UI

9. **Navegación al detalle:**
   - Las filas NO son clickeables
   - No hay botón "Ver detalle" por fila

#### Detalles técnicos:

**Paginación:**
```typescript
const { data: materialsData } = useMaterials({
  page: pageMaterials,
  limit: 10,
  search: searchMaterials || undefined,
});
```

**Búsqueda:**
```typescript
<Input
  placeholder="Buscar por nombre o descripción..."
  value={searchMaterials}
  onChange={(e) => {
    setSearchMaterials(e.target.value);
    setPageMaterials(1); // ✅ Reinicia paginación
  }}
/>
```

**Permisos:**
- NO se validan permisos en esta vista
- NO hay botones condicionados por rol

---

### 2.2 PROD-002 – Crear Producto

**Estado:** `[MISSING]` ❌

#### ❌ No Implementado:

1. **Formulario de creación:**
   - NO existe componente `CreateProductDialog` o `ProductFormDialog`
   - NO existe vista `/products/new`
   - NO hay botón "Crear Producto" en ProductsView

2. **Validaciones:**
   - NO hay schemas Zod para validación de productos
   - NO existe en `src/shared/schemas/`

3. **Caso de uso:**
   - NO existe `CreateProduct.ts` en `src/application/usecases/product/`
   - NO hay método `create()` en `IProductRepository`

4. **Hook de mutación:**
   - NO existe hook `useCreateProduct` con React Query mutation

#### Archivos que deberían existir (NO EXISTEN):

- `src/presentation/components/CreateProductDialog.tsx`
- `src/application/usecases/product/CreateProduct.ts`
- `src/shared/schemas/productSchema.ts`
- Método en `IProductRepository`: `create(data: CreateProductInput): Promise<Product>`

---

### 2.3 PROD-003 – Ver Detalle Producto

**Estado:** `[PARTIAL]` ⚠️

#### ✅ Implementado:

1. **Vista de detalle:**
   - Archivo: `src/presentation/views/ProductDetailView.tsx`
   - Ruta: `/products/[kind]/[id]` (por ejemplo `/products/equipment/abc-123`)

2. **Campos mostrados:**
   - ID del producto ✅
   - Nombre ✅
   - Tipo (kind) con label legible ✅
   - Descripción ✅ (en tab "Información General")
   - Unidad de medida ✅ (solo para materiales)
   - Estado (Activo/Inactivo) con badge ✅
   - Moneda ✅
   - Fecha de creación ✅
   - Fecha de última actualización ✅
   - Modelo ✅ (solo para equipos)
   - Peligrosidad ✅ (solo para materiales)

3. **Estructura de tabs:**
   - Tab "Información General" ✅
   - Tab "Asociaciones" ✅ (con placeholders)
   - Tab "Historial" ✅ (con placeholder)

4. **Validaciones UX:**
   - Si ID no existe: Toast rojo "Producto no encontrado" ✅
   - Si falla backend: Toast rojo "Error al cargar el producto" ✅
   - Estado de loading con spinner ✅

5. **Permisos:**
   - Vista visible para todos los roles ✅
   - Botones "Editar" y "Dar de baja" solo visibles si `isAdmin() || isManager()` ✅

#### ❌ Faltante:

1. **Campo "Código":**
   - NO se muestra
   - El modelo tiene `sku` opcional pero no se renderiza

2. **Costo unitario:**
   - Se muestra "Pendiente de formato" como placeholder
   - Campo `monetaryValueRaw` no se parsea ni se formatea

3. **Proveedor asociado:**
   - Tab "Asociaciones" tiene placeholder "Sin proveedor asociado"
   - NO se muestra `providerId` ni se resuelve el nombre

4. **Proyectos asociados:**
   - Tab "Asociaciones" tiene placeholder "No hay proyectos asociados todavía"
   - Campo `projectId` no se usa

5. **Usuario que creó/modificó:**
   - NO se muestra
   - El backend no expone estos campos en la respuesta actual

6. **Categorías (para materiales):**
   - Se muestran como IDs en badges
   - NO se resuelven los nombres de las categorías

7. **Funcionalidad de botones:**
   - Botón "Editar": Muestra toast "Función en desarrollo"
   - Botón "Dar de baja": Muestra toast "Función en desarrollo"
   - NO están conectados a funcionalidad real

#### Detalles técnicos:

**Hook usado:**
```typescript
const { data: product, isLoading, error } = useProductDetail(productId, kind);
```

**Manejo de errores:**
```typescript
if (error) {
  const errorMessage = (error as Error).message;
  if (errorMessage === 'NOT_FOUND') {
    toast({ title: "Producto no encontrado", variant: "destructive" });
  }
}
```

**Permisos:**
```typescript
const { isAdmin, isManager } = usePermissions();
const canEdit = isAdmin() || isManager();

{canEdit && (
  <Button onClick={...}>Editar</Button>
)}
```

---

### 2.4 PROD-004 – Editar Producto

**Estado:** `[MISSING]` ❌

#### ❌ No Implementado:

1. **Formulario de edición:**
   - NO existe componente `EditProductDialog` o similar
   - NO existe vista `/products/[kind]/[id]/edit`
   - El botón "Editar" en ProductDetailView muestra solo un toast placeholder

2. **Validaciones:**
   - NO hay schemas Zod para validación de edición
   - NO hay validación de campos obligatorios
   - NO hay validación de código inmutable

3. **Caso de uso:**
   - NO existe `UpdateProduct.ts` en `src/application/usecases/product/`
   - NO hay método `update()` en `IProductRepository`

4. **Hook de mutación:**
   - NO existe hook `useUpdateProduct` con React Query mutation

5. **Modal de confirmación:**
   - NO implementado
   - NO hay modal "¿Está seguro de realizar la modificación?"

6. **Campo de justificación:**
   - NO implementado
   - NO hay input para justificación en cambios sensibles (costo, moneda, unidad)

7. **Auditoría de cambios:**
   - NO se registran cambios desde el frontend
   - NO se envía justificación al backend

#### Archivos que deberían existir (NO EXISTEN):

- `src/presentation/components/EditProductDialog.tsx`
- `src/application/usecases/product/UpdateProduct.ts`
- Método en `IProductRepository`: `update(id: string, kind: ProductKind, data: UpdateProductInput): Promise<Product>`
- Hook: `src/hooks/useProducts.ts` → `useUpdateProduct`

---

### 2.5 PROD-005 – Historial y Trazabilidad de Producto

**Estado:** `[MISSING]` ❌

#### ❌ No Implementado:

1. **Vista de historial:**
   - Existe tab "Historial" en ProductDetailView
   - Contenido: Solo placeholder "Historial de producto en desarrollo"

2. **Hook de historial:**
   - NO existe `useProductHistory` hook
   - NO hay llamadas a endpoint de historial

3. **Endpoint de backend:**
   - NO se consume ningún endpoint de historial
   - El `ApiProductRepository` no tiene método para historial

4. **Filtros de historial:**
   - NO implementados (rango de fechas, usuario, tipo de evento)

5. **Exportación CSV/Excel:**
   - NO implementada

6. **Tabla de eventos:**
   - NO existe componente para mostrar eventos históricos
   - NO se muestran: fecha, usuario, tipo de evento, valores anteriores/nuevos, justificación

#### Archivos que deberían existir (NO EXISTEN):

- `src/application/usecases/product/GetProductHistory.ts`
- Método en `IProductRepository`: `getHistory(productId: string, kind: ProductKind, filters?: HistoryFilters): Promise<ProductHistoryEvent[]>`
- Hook: `src/hooks/useProducts.ts` → `useProductHistory`
- Componente: `src/presentation/components/ProductHistoryTable.tsx`

---

## 3. Permisos y Roles en el Módulo de Productos

### 3.1 Sistema de Permisos Actual

**Ubicación:** `src/hooks/use-permissions.ts`

**Roles detectados:**
- `isAdmin()` - Administrador
- `isManager()` - Jefe de Área
- `isSupervisor()` - Supervisor

### 3.2 Aplicación de Permisos por Vista

#### **Vista de Listado (ProductsView)**

**Estado:** ❌ **NO SE VALIDAN PERMISOS**

- NO hay condicionales por rol
- NO hay botones "Crear Producto" condicionados
- Todos los usuarios ven la misma vista
- **Faltante:**
  - Botón "Crear Producto" solo para Admin/Jefe de Área
  - Filtros visibles para todos
  - Acciones por fila condicionadas por rol

#### **Vista de Detalle (ProductDetailView)**

**Estado:** ✅ **CORRECTAMENTE IMPLEMENTADO**

```typescript
const { isAdmin, isManager } = usePermissions();
const canEdit = isAdmin() || isManager();

{canEdit && (
  <>
    <Button>Editar</Button>
    <Button>Dar de baja</Button>
  </>
)}
```

- ✅ Supervisor: Solo lectura, NO ve botones de edición
- ✅ Admin/Jefe de Área: Ven botones "Editar" y "Dar de baja"
- ✅ Vista de información visible para todos

#### **Formularios de Creación/Edición**

**Estado:** ❌ **NO EXISTEN FORMULARIOS**

- NO hay validación de permisos porque no existen los formularios

### 3.3 Inconsistencias Detectadas

1. **Falta botón "Crear Producto":**
   - No existe en ProductsView
   - Debería estar condicionado a `canEdit`

2. **Falta acciones por fila:**
   - No hay botón "Ver detalle" en las filas
   - No hay botón "Editar rápido" (si aplica)

3. **Botones de detalle no funcionales:**
   - Los botones "Editar" y "Dar de baja" muestran toasts placeholder
   - NO ejecutan acciones reales

---

## 4. Checklist de Tareas para Completar el Módulo de Productos

> **Nota:** Este checklist representa tareas para completar el módulo de productos según los requerimientos del ERS.
> 
> **Última actualización:** 30/01/2026
> - ✅ **COMMIT 2:** Mejoras al listado - columnas nuevas, navegación clickeable, botón crear con permisos, manejo de errores

### 4.1 Listado (PROD-001) - **EN PROGRESO** 🔄

#### Filtros y Búsqueda
- [x] ✅ **COMPLETADO (Commit 2):** Agregar columna "Código" (SKU) en todas las tablas
- [ ] **PENDIENTE:** Agregar columna "Proveedor" y resolver nombre desde `providerId`
- [x] ✅ **COMPLETADO (Commit 2):** Mostrar "Costo unitario" (por ahora "SIN FORMATO" hasta que backend corrija `monetaryValueRaw`)
- [ ] **PENDIENTE:** Cambiar columna "Fecha Creación" por "Fecha de última modificación" (`updatedAt`)
- [ ] **PENDIENTE:** Implementar filtro por Estado (Activo/Inactivo) con select/checkbox
- [ ] **PENDIENTE:** Implementar filtro por Proveedor (select con carga de proveedores)
- [ ] **PENDIENTE:** Implementar filtro por Proyecto (select con carga de proyectos)
- [ ] **PENDIENTE:** Implementar filtro por Moneda (select: CLP, USD, EUR)
- [ ] **PENDIENTE:** Aplicar filtro por defecto `isActive: true` (solo productos activos)
- [ ] **PENDIENTE:** Normalizar búsqueda: case-insensitive y trim (validar si backend lo hace)

#### UX y Navegación
- [x] ✅ **COMPLETADO (Commit 2):** Agregar manejo de errores con toast rojo "Error al cargar los productos"
- [x] ✅ **COMPLETADO (Commit 2):** Hacer filas clickeables para navegar al detalle (onClick con router.push)
- [ ] **PENDIENTE (OPCIONAL):** Agregar botón "Ver detalle" en cada fila (ya está como clickeable)
- [x] ✅ **COMPLETADO (Commit 2):** Agregar botón "Crear Producto" en header (solo Admin/Jefe de Área)
- [ ] **PENDIENTE:** Mejorar estado vacío: mostrar mensaje según filtros aplicados

#### Técnico
- [ ] **PENDIENTE:** Extender `ListProductsParams` en `IProductRepository` con nuevos filtros (estado, proveedor, proyecto, moneda)
- [ ] **PENDIENTE:** Extender `ApiProductRepository.list()` para soportar nuevos query params

---

### 4.2 Creación (PROD-002)

#### Arquitectura y Dominio
- [ ] Crear interfaz `CreateProductInput` en `src/domain/repositories/IProductRepository.ts`
- [ ] Agregar método `create(data: CreateProductInput): Promise<Product>` a `IProductRepository`
- [ ] Implementar método `create()` en `ApiProductRepository` llamando a POST `/equipment`, `/materials` o `/spare-parts`
- [ ] Crear caso de uso `src/application/usecases/product/CreateProduct.ts`

#### Validación
- [ ] Crear schema Zod en `src/shared/schemas/productSchema.ts` con:
  - Campos obligatorios: nombre, código, unidad, costo, moneda, estado
  - Validación: código único (frontend puede solo validar formato, backend valida unicidad)
  - Validación: costo >= 0
  - Validación: moneda en catálogo permitido
- [ ] Normalización: código en mayúsculas, trim de espacios

#### UI
- [ ] Crear componente `src/presentation/components/CreateProductDialog.tsx`
- [ ] Formulario con campos:
  - Nombre (input text)
  - Código (input text, mayúsculas automáticas)
  - Unidad de medida (select desde catálogo)
  - Costo unitario (input number >= 0)
  - Moneda (select: CLP, USD, EUR)
  - Estado (select: Activo/Inactivo, default Activo)
  - Descripción (textarea opcional)
  - Proveedor (select opcional)
  - Proyectos (multi-select opcional)
- [ ] Validación visual de campos con errores en rojo
- [ ] Toast éxito: "Producto creado exitosamente"
- [ ] Toast error: "Error al procesar la operación de producto"
- [ ] Deshabilitar botón "Guardar" mientras falta campo obligatorio

#### Hooks
- [ ] Crear hook `useCreateProduct` en `src/hooks/useProducts.ts` con React Query mutation
- [ ] Invalidar queries de listado al crear exitosamente
- [ ] Redirigir al detalle del producto creado

---

### 4.3 Detalle (PROD-003)

#### Campos Faltantes
- [ ] Mostrar campo "Código" (SKU) en información maestra
- [ ] Formatear y mostrar "Costo unitario" (parsear `monetaryValueRaw`)
- [ ] Mostrar "Proveedor asociado" resolviendo nombre desde `providerId`
- [ ] Mostrar "Proyectos asociados" resolviendo nombres desde `projectId`
- [ ] Mostrar "Usuario que creó" y "Usuario que modificó" (requiere cambio en backend)
- [ ] Resolver nombres de categorías (materiales) en lugar de mostrar solo IDs

#### Tab Asociaciones
- [ ] Implementar lógica para cargar y mostrar proveedor asociado
- [ ] Implementar lógica para cargar y mostrar proyectos asociados
- [ ] Para repuestos: mostrar equipo asociado resolviendo `equipmentId`

#### Técnico
- [ ] Crear hook `useProvider(id)` si no existe
- [ ] Crear hook `useProjects(ids[])` si no existe
- [ ] Extender `ApiProductRepository` para incluir datos relacionados en respuesta (o consultas adicionales)

---

### 4.4 Edición (PROD-004)

#### Arquitectura y Dominio
- [ ] Crear interfaz `UpdateProductInput` en `src/domain/repositories/IProductRepository.ts`
- [ ] Agregar método `update(id: string, kind: ProductKind, data: UpdateProductInput): Promise<Product>` a `IProductRepository`
- [ ] Implementar método `update()` en `ApiProductRepository` llamando a PATCH `/equipment/:id`, `/materials/:id` o `/spare-parts/:id`
- [ ] Crear caso de uso `src/application/usecases/product/UpdateProduct.ts`

#### Validación
- [ ] Extender schema Zod de producto para modo edición
- [ ] Validación: código NO editable (campo readonly)
- [ ] Validación: costo >= 0
- [ ] Validación: moneda en catálogo permitido
- [ ] Detectar cambios "sensibles" (costo, moneda, unidad) para requerir justificación

#### UI
- [ ] Crear componente `src/presentation/components/EditProductDialog.tsx`
- [ ] Prellenar formulario con datos actuales del producto
- [ ] Campo "Código" readonly (solo visible, no editable)
- [ ] Formulario con mismos campos que creación (excepto código)
- [ ] Si hay cambios sensibles: mostrar campo "Justificación" obligatorio
- [ ] Modal de confirmación: "¿Está seguro de realizar la modificación?"
- [ ] Toast éxito: "Producto actualizado correctamente"
- [ ] Toast error: "Error al procesar la operación de producto"

#### Restricciones
- [ ] Si producto usado en Cajas: modal adicional de advertencia "Este producto está asignado a N cajas"
- [ ] Requerir confirmación explícita para cambios sensibles

#### Hooks
- [ ] Crear hook `useUpdateProduct` en `src/hooks/useProducts.ts` con React Query mutation
- [ ] Invalidar queries de listado y detalle al actualizar exitosamente
- [ ] Mantener usuario en vista de detalle después de editar

---

### 4.5 Historial (PROD-005)

#### Arquitectura y Backend
- [ ] Verificar si backend expone endpoint de historial (ej: GET `/equipment/:id/history`)
- [ ] Crear interfaz `ProductHistoryEvent` en `src/domain/entities/ProductHistory.ts` con:
  - `id`, `productId`, `eventType`, `performedBy`, `performedAt`
  - `previousValue`, `newValue`, `justification`
- [ ] Agregar método `getHistory(productId: string, kind: ProductKind, filters?: HistoryFilters): Promise<ProductHistoryEvent[]>` a `IProductRepository`
- [ ] Implementar método en `ApiProductRepository`
- [ ] Crear caso de uso `src/application/usecases/product/GetProductHistory.ts`

#### UI
- [ ] Crear componente `src/presentation/components/ProductHistoryTable.tsx`
- [ ] Tabla con columnas:
  - Fecha y hora
  - Usuario responsable
  - Tipo de evento (badge con color)
  - Valor anterior
  - Valor nuevo
  - Justificación
- [ ] Ordenamiento cronológico descendente (más reciente primero)

#### Filtros
- [ ] Implementar filtro por rango de fechas (DateRangePicker)
- [ ] Implementar filtro por usuario (select)
- [ ] Implementar filtro por tipo de evento (select multiple)
- [ ] Botón "Limpiar filtros"

#### Exportación
- [ ] Implementar botón "Exportar a CSV"
- [ ] Implementar botón "Exportar a Excel" (opcional)
- [ ] Función `exportProductHistoryToCSV(events: ProductHistoryEvent[])`

#### Hooks
- [ ] Crear hook `useProductHistory(productId, kind, filters)` en `src/hooks/useProducts.ts`
- [ ] Manejo de estados: loading, error, empty

#### UX
- [ ] Estado vacío: "No hay eventos históricos para este producto"
- [ ] Toast error: "Error al cargar historial del producto"
- [ ] Tooltip en valores complejos (ej: JSON de `monetaryValueRaw`)

---

### 4.6 Tareas Transversales

#### Tipos y Constantes
- [ ] Crear constantes de monedas en `src/shared/constants.ts`: `CURRENCIES = ['CLP', 'USD', 'EUR']`
- [ ] Crear constantes de tipos de evento de historial
- [ ] Crear tipos compartidos para filtros complejos

#### Catálogos
- [ ] Implementar hook `useCurrencies()` si backend expone catálogo
- [ ] Implementar hook `useUnitsOfMeasure()` para catálogo de unidades
- [ ] Implementar hook `useMaterialCategories()` para categorías de materiales

#### Formateo
- [ ] Crear utilidad `formatMonetaryValue(raw: unknown): string` para parsear y formatear valores monetarios
- [ ] Crear utilidad `formatCurrency(amount: number, currency: string): string`

#### Testing
- [ ] Escribir tests unitarios para casos de uso
- [ ] Escribir tests de integración para repositorios
- [ ] Escribir tests E2E para flujos de usuario (crear, editar, ver detalle)

#### Documentación
- [ ] Documentar API de hooks en JSDoc
- [ ] Actualizar README con flujos de productos
- [ ] Documentar convenciones de permisos

---

## 5. Resumen Ejecutivo

### Estado General del Módulo: **60% COMPLETO** ⚠️

#### ✅ Lo que está bien:
1. **Arquitectura limpia:** Domain → Application → Infrastructure → Hooks → Presentation
2. **Entidad unificada:** Product con campo `kind` funciona correctamente
3. **Repositorio fachada:** ApiProductRepository mapea bien a los 3 endpoints
4. **Hooks React Query:** Bien estructurados con wrappers de conveniencia
5. **Vista de listado básica:** Tabs, paginación, búsqueda funcionan
6. **Vista de detalle básica:** Muestra información, tabs, permisos correctos
7. **Manejo de errores:** Toasts y estados de loading en detalle

#### ❌ Lo que falta:
1. **Funcionalidad CRUD completa:** Solo hay READ, faltan CREATE, UPDATE
2. **Formularios:** No existen formularios de creación ni edición
3. **Filtros avanzados:** Solo búsqueda por texto, faltan filtros por estado, proveedor, proyecto, moneda
4. **Historial:** Tab placeholder, sin implementación real
5. **Columnas faltantes:** Código, proveedor, costo unitario formateado
6. **Navegación:** Filas no clickeables, falta botón de crear
7. **Validaciones:** No hay schemas Zod, no hay validación de formularios
8. **Asociaciones:** Placeholders en tab de asociaciones
9. **Permisos en listado:** No se validan permisos en la vista de listado

### Prioridades Recomendadas:

**ALTA PRIORIDAD (Funcionalidad crítica):**
1. Implementar formulario de creación de productos (PROD-002)
2. Implementar formulario de edición de productos (PROD-004)
3. Agregar filtros avanzados en listado (estado, proveedor, proyecto)
4. Hacer filas clickeables para navegar al detalle
5. Agregar columnas faltantes (código, costo formateado)

**MEDIA PRIORIDAD (Mejoras UX):**
6. Implementar historial de productos (PROD-005)
7. Resolver nombres de proveedores y proyectos en detalle
8. Formatear valores monetarios correctamente
9. Agregar botón "Crear Producto" con permisos

**BAJA PRIORIDAD (Nice to have):**
10. Exportación de historial a CSV/Excel
11. Filtros avanzados de historial
12. Tests E2E completos
13. Documentación extendida

---

## 6. Notas Técnicas

### Compatibilidad con Backend
- El frontend está **bien alineado** con los endpoints actuales del backend
- Los mapeos de DTOs son correctos
- El campo `monetaryValueRaw` espera que el backend corrija el formato (pendiente)

### Arquitectura
- La estructura sigue correctamente Clean Architecture
- No hay violaciones de dependencias (domain no importa infrastructure)
- Los hooks usan correctamente el RepositoryProvider

### Performance
- React Query cachea correctamente las queries (staleTime: 5 min)
- No hay problemas de re-renders innecesarios detectados
- Paginación server-side implementada correctamente

### Seguridad
- Sistema de permisos basado en roles funciona
- Falta validación de permisos a nivel de API calls (debería validarse en backend)
- No hay exposición de datos sensibles

---

**Fin del documento de auditoría**
