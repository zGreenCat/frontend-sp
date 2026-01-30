# Changelog - Commit 2: Mejoras al Listado de Productos

**Fecha:** 30 de Enero de 2026  
**Módulo:** Productos (Frontend)  
**Tipo de cambio:** Feature/Enhancement  
**Estado ERS PROD-001:** PARTIAL → EN PROGRESO (70% completo)

---

## 📋 Resumen Ejecutivo

Este commit mejora significativamente la vista de listado de productos (`ProductsView.tsx`) acercándola a los requerimientos del ERS, específicamente para **PROD-001: Listar / Buscar Productos**.

### ✅ Cambios Implementados

#### 1. **Nuevas Columnas en Tablas** 
   - ✅ Columna "Código" (SKU) agregada en las 3 tablas (Materiales, Equipos, Repuestos)
   - ✅ Columna "Costo unitario" agregada (muestra "SIN FORMATO" hasta que backend corrija `monetaryValueRaw`)
   - Las columnas existentes se mantienen y reorganizan para mejor UX

#### 2. **Navegación al Detalle**
   - ✅ Filas ahora son clickeables con efecto hover (`cursor-pointer hover:bg-muted/50`)
   - ✅ Click en fila navega a `/products/[kind]/[id]` usando `router.push()`
   - ✅ Mapeo correcto de ProductKind a URL: `MATERIAL` → `material`, `EQUIPMENT` → `equipment`, `SPARE_PART` → `spare_part`

#### 3. **Botón "Crear Producto" con Permisos**
   - ✅ Agregado en header de la vista
   - ✅ Visible solo para usuarios Admin o Manager (`isAdmin() || isManager()`)
   - ✅ Icono Plus (`<Plus />`) de lucide-react
   - ✅ Al hacer click muestra toast: "Funcionalidad en desarrollo"

#### 4. **Manejo de Errores**
   - ✅ Hooks ahora capturan `error` de React Query (`useMaterials`, `useEquipments`, `useSpareParts`)
   - ✅ `useEffect` detecta errores por tab activo y muestra toast destructivo
   - ✅ Título: "Error al cargar los productos"
   - ✅ Descripción: mensaje de error o fallback específico por tipo
   - ✅ No rompe estados de loading/empty existentes

---

## 📂 Archivos Modificados

### `src/presentation/views/ProductsView.tsx` (526 → 600 líneas aprox.)

**Imports agregados:**
```typescript
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { ProductKind } from "@/domain/entities/Product";
```

**Estado y hooks nuevos:**
```typescript
const router = useRouter();
const { toast } = useToast();
const { isAdmin, isManager } = usePermissions();
const canCreateProduct = isAdmin() || isManager();
```

**Funciones agregadas:**
```typescript
// Navegar al detalle
const handleNavigateToDetail = (productId: string, kind: ProductKind) => {
  router.push(`/products/${kind.toLowerCase()}/${productId}`);
};

// Handler para crear producto (placeholder)
const handleCreateProduct = () => {
  toast({
    title: "Funcionalidad en desarrollo",
    description: "La creación de productos estará disponible próximamente",
  });
};
```

**useEffects para manejo de errores:**
```typescript
useEffect(() => {
  if (errorMaterials && activeTab === "materials") {
    toast({
      variant: "destructive",
      title: "Error al cargar los productos",
      description: (errorMaterials as Error).message || "No se pudieron cargar los materiales",
    });
  }
}, [errorMaterials, activeTab, toast]);
// ... similar para equipments y spareParts
```

**Cambios en header:**
```tsx
<div className="flex items-center justify-between">
  <div>
    <h1>Productos</h1>
    <p>Catálogo de materiales, equipos y repuestos logísticos</p>
  </div>
  {canCreateProduct && (
    <Button onClick={handleCreateProduct}>
      <Plus className="h-4 w-4" />
      Crear producto
    </Button>
  )}
</div>
```

**Cambios en tablas (ejemplo para Materiales):**

Columnas agregadas:
```tsx
<TableHead>Código</TableHead>          {/* NUEVO */}
<TableHead>Costo unitario</TableHead>  {/* NUEVO */}
```

Filas clickeables:
```tsx
<TableRow 
  className="cursor-pointer hover:bg-muted/50 transition-colors"
  onClick={() => handleNavigateToDetail(material.id, 'MATERIAL')}
>
  <TableCell>
    <Badge variant="outline" className="font-mono text-xs">
      {material.sku || "—"}
    </Badge>
  </TableCell>
  {/* ... otras celdas ... */}
  <TableCell>
    <p className="text-xs text-muted-foreground italic">
      SIN FORMATO
    </p>
  </TableCell>
</TableRow>
```

---

## 🎯 Mejoras de UX

1. **Interactividad mejorada:**
   - Usuario ahora puede hacer click en cualquier parte de la fila para ver detalle
   - Efecto hover visual indica que es clickeable
   - Mejora discoverability sin necesidad de botón explícito "Ver detalle"

2. **Información más completa:**
   - Código del producto visible (importante para operaciones)
   - Columna de costo preparada para cuando backend corrija formato

3. **Feedback de errores:**
   - Usuario es notificado inmediatamente si falla la carga de productos
   - Toast destructivo es visible y no invasivo

4. **Control de acceso:**
   - Botón "Crear producto" solo visible para roles autorizados
   - Experiencia personalizada según permisos del usuario

---

## 🧪 Validación Técnica

### ✅ Verificaciones Realizadas:

1. **TypeScript Compilation:** ✅ Pasa sin errores
   ```bash
   npx tsc --noEmit
   # 0 errors
   ```

2. **Arquitectura respetada:** ✅
   - Vista usa hooks (`useProducts`, `usePermissions`, `useToast`)
   - No hay acoplamiento directo a `apiClient`
   - Separación de concerns mantenida

3. **Tipos correctos:** ✅
   - `ProductKind` importado y usado correctamente
   - `error` capturado como `Error` con type assertion segura
   - Props de componentes UI respetan interfaces de shadcn/ui

4. **Compatibilidad con código existente:** ✅
   - No rompe funcionalidad de paginación
   - No rompe funcionalidad de búsqueda
   - Estados loading/empty siguen funcionando

---

## 📊 Progreso del Módulo

### Estado Anterior (Commit 1):
- **PROD-001:** PARTIAL (50%)
- **PROD-002:** MISSING (0%)
- **PROD-003:** PARTIAL (60%)
- **PROD-004:** MISSING (0%)
- **PROD-005:** MISSING (0%)

### Estado Actual (Commit 2):
- **PROD-001:** EN PROGRESO (70%) ⬆️ +20%
- **PROD-002:** MISSING (0%)
- **PROD-003:** PARTIAL (60%)
- **PROD-004:** MISSING (0%)
- **PROD-005:** MISSING (0%)

### Tareas PROD-001 Completadas en este Commit:
- [x] Columna "Código" (SKU)
- [x] Columna "Costo unitario" (preparada para formato)
- [x] Filas clickeables → navegación al detalle
- [x] Botón "Crear Producto" con permisos
- [x] Manejo de errores con toast

### Tareas PROD-001 PENDIENTES (para siguiente commit):
- [ ] Columna "Proveedor" (requiere resolver `providerId`)
- [ ] Cambiar "Fecha Creación" → "Fecha última modificación"
- [ ] Filtro por Estado (Activo/Inactivo)
- [ ] Filtro por Proveedor
- [ ] Filtro por Proyecto
- [ ] Filtro por Moneda
- [ ] Filtro por defecto `isActive: true`
- [ ] Mejorar mensajes de estado vacío

---

## 🔜 Próximos Pasos Recomendados

### Prioridad ALTA:
1. **Implementar filtros avanzados** (estado, proveedor, proyecto, moneda)
2. **Crear formulario de creación de productos** (PROD-002)
3. **Resolver nombres de proveedores** (requiere hook `useProvider`)

### Prioridad MEDIA:
4. **Formatear valores monetarios** cuando backend corrija `monetaryValueRaw`
5. **Implementar formulario de edición** (PROD-004)
6. **Agregar columna "Fecha última modificación"**

### Prioridad BAJA:
7. **Botón "Ver detalle" adicional** (opcional, ya hay filas clickeables)
8. **Mensajes contextuales en estados vacíos**

---

## 📝 Notas Técnicas

### Decisión: "SIN FORMATO" vs Formatear monetaryValueRaw

**Por qué no parseamos `monetaryValueRaw` aún:**
- El backend devuelve formato Decimal128 de MongoDB: `{ s: 1, e: 3, d: [12000, 0] }`
- No tenemos función de parseo confiable todavía
- Auditoría indica que backend debe corregir este formato
- Dejar "SIN FORMATO" es transparente y honesto con el usuario
- Columna ya está preparada para recibir valor formateado en futuro commit

### Decisión: Filas clickeables sin botón explícito

**Por qué no agregamos botón "Ver detalle":**
- Toda la fila es clickeable (patrón común en tablas modernas)
- Efecto hover hace obvio que es interactivo
- Reduce ruido visual en la tabla
- Permite agregar botones de acción específicos en el futuro (editar, eliminar) sin saturar la UI

### Decisión: useEffect para manejo de errores

**Por qué no usar onError de React Query:**
- Necesitamos detectar tab activo para mostrar toast solo en tab correspondiente
- `useEffect` con dependencia de `activeTab` garantiza toast contextual
- Evita spam de toasts si usuario cambia rápidamente entre tabs
- Permite lógica más compleja en el futuro (reintentos, logs, etc.)

---

## ✅ Checklist de Auditoría Actualizado

Ver `AUDITORIA_MODULO_PRODUCTOS_FRONTEND.md` sección 4.1 para checklist completo actualizado con estado de cada tarea.

**Fin del changelog**
