# 🗺️ Plan de Fases Pendientes - SmartPack Frontend

**Proyecto:** SmartPack - Sistema de Gestión de Inventario  
**Fecha de creación:** 12 de Diciembre, 2025  
**Arquitectura:** Clean Architecture (Domain → Application → Infrastructure → Presentation)  
**Progreso actual:** 12/17 TODOs completados (71%)

---

## 📊 Estado General del Proyecto

| Fase | Estado | TODOs Incluidos | Requiere Backend | Complejidad |
|------|--------|-----------------|------------------|-------------|
| ✅ **Fase 0** | COMPLETADA | TODOs críticos (pre-existentes) | No | - |
| ✅ **Fase 1** | COMPLETADA | #13, #14, #11 | No | Baja |
| ⏳ **Fase 2** | PENDIENTE | #10 | Sí | Media |
| ⏳ **Fase 3** | PENDIENTE | #19, #23 | Sí | Media |
| ⏳ **Fase 4** | PENDIENTE | #12 | Sí (solo validación) | Baja |
| ⏳ **Fase 5** | PENDIENTE | #18 | Sí | Alta |
| 🎯 **Fase 6** | FUTURA | Testing E2E | Parcial | Alta |

---

## ✅ FASE 0: TODOs Críticos Pre-Existentes (COMPLETADA)

### Resumen
Funcionalidades críticas implementadas antes del plan de fases actual.

### TODOs Incluidos

| TODO | Descripción | Archivo | Estado |
|------|-------------|---------|--------|
| #1 | Supervisores bloqueados de lista usuarios | `UsersView.tsx` | ✅ |
| #8 | Login valida usuario deshabilitado | `authService.ts` | ✅ |
| #15 | Validar área sea nodo hoja para bodegas | `AreaDetailView.tsx` | ✅ |
| #17 | Solo gerentes habilitados asignables | `AssignmentsDialog.tsx` | ✅ |
| #6, #9 | Sistema UserEnablementHistory | Múltiples archivos | ✅ |
| #2 | Búsqueda por RUT | `UsersView.tsx` | ✅ |
| #3 | Usuarios deshabilitados en rojo | `UsersView.tsx` | ✅ |
| #4 | Deshabilitar botones usuarios deshabilitados | `UsersView.tsx` | ✅ |
| #7 | Mensajes específicos modal confirmación | `UsersView.tsx` | ✅ |

### Dependencias Backend (Ya Implementadas)
- ✅ `GET /users/{userId}/enablement-history`
- ✅ `GET /enablement-history` (Admin only)
- ✅ `PUT /users/{id}` registra en `UserEnablementHistory`

---

## ✅ FASE 1: Mejoras UX Frontend (COMPLETADA)

### Resumen
Mejoras de experiencia de usuario que NO requieren cambios en backend.

### TODOs Incluidos

| TODO | Descripción | Archivo | Líneas | Estado |
|------|-------------|---------|--------|--------|
| #13, #14 | Validar estado y capacidad bodegas | `AssignWarehousesDialog.tsx` | 64-90 | ✅ |
| #11 | Modal advertencia única bodega | `AreaDetailView.tsx` | 71-73, 121-136, 575-585 | ✅ |
| #14 | Mensaje reasignación específico | `AssignmentsDialog.tsx` | 177-210, 340-347 | ✅ |

### Implementación Realizada

**1. Validación de Bodegas:**
- Solo muestra bodegas ACTIVAS
- Excluye bodegas sin capacidad (100% llenas)
- Label mejorado: `Nombre (actual/max kg - XX% usado)`

**2. Modal Advertencia:**
- Detecta única bodega en área
- Doble confirmación para remover
- Mensaje contextual con nombre de área

**3. Mensaje Reasignación:**
- Resumen dinámico de cambios
- Botón disabled si no hay cambios
- Banner visual antes de guardar

### Sin Dependencias Backend
✅ Todo funciona con datos ya disponibles

---

## ⏳ FASE 2: Historial de Asignaciones de Usuario

### Objetivo
Implementar sistema completo de historial de asignaciones (áreas y bodegas) por usuario, siguiendo el patrón de `UserEnablementHistory`.

### TODO Principal
**#10: Mostrar historial de asignaciones en AssignmentsDialog**

### Requerimiento Relacionado
- **ID:** `USR-005` - Modificar Asignaciones
- **Extracto:** *"Se debe registrar un historial de cada asignación, incluyendo quién realizó la acción, a quién asignó, qué entidad fue asignada y la fecha."*

### Arquitectura Propuesta

#### 1️⃣ Domain Layer

**Archivo NUEVO:** `src/domain/entities/AssignmentHistory.ts`
```typescript
export type AssignmentAction = 'ASSIGNED' | 'REMOVED';
export type AssignmentEntityType = 'AREA' | 'WAREHOUSE';

export interface AssignmentHistoryEntry {
  id: string;
  userId: string;              // Usuario afectado
  entityId: string;            // ID del área o bodega
  entityName: string;          // Nombre para UI
  entityType: AssignmentEntityType;
  action: AssignmentAction;
  performedBy: string;         // ID quien ejecutó
  performedByName: string;     // Nombre quien ejecutó
  timestamp: Date;
  tenantId: string;
}

export interface AssignmentHistoryResponse {
  data: AssignmentHistoryEntry[];
  total: number;
  page: number;
  limit: number | null;
}
```

**Archivo NUEVO:** `src/domain/repositories/IAssignmentHistoryRepository.ts`
```typescript
import { AssignmentHistoryEntry, AssignmentHistoryResponse } from '../entities/AssignmentHistory';

export interface GetAssignmentHistoryFilters {
  userId?: string;
  entityType?: AssignmentEntityType;
  action?: AssignmentAction;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export interface IAssignmentHistoryRepository {
  /**
   * GET /assignment-history/user/{userId}
   */
  findByUserId(
    userId: string,
    page?: number,
    limit?: number
  ): Promise<AssignmentHistoryResponse>;

  /**
   * GET /assignment-history (Admin only)
   */
  findAll(
    filters?: GetAssignmentHistoryFilters
  ): Promise<AssignmentHistoryResponse>;
}
```

#### 2️⃣ Infrastructure Layer

**Archivo NUEVO:** `src/infrastructure/repositories/ApiAssignmentHistoryRepository.ts`
```typescript
import { apiClient } from '../api/apiClient';
import {
  IAssignmentHistoryRepository,
  GetAssignmentHistoryFilters,
} from '@/domain/repositories/IAssignmentHistoryRepository';
import {
  AssignmentHistoryEntry,
  AssignmentHistoryResponse,
} from '@/domain/entities/AssignmentHistory';

export class ApiAssignmentHistoryRepository implements IAssignmentHistoryRepository {
  async findByUserId(
    userId: string,
    page: number = 1,
    limit?: number
  ): Promise<AssignmentHistoryResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());

      const response = await apiClient.get<any>(
        `/assignment-history/user/${userId}?${params.toString()}`,
        true
      );

      return this.mapResponse(response);
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      throw error;
    }
  }

  async findAll(
    filters?: GetAssignmentHistoryFilters
  ): Promise<AssignmentHistoryResponse> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        if (filters.userId) params.append('userId', filters.userId);
        if (filters.entityType) params.append('entityType', filters.entityType);
        if (filters.action) params.append('action', filters.action);
        if (filters.from) params.append('from', filters.from.toISOString());
        if (filters.to) params.append('to', filters.to.toISOString());
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
      }

      const response = await apiClient.get<any>(
        `/assignment-history?${params.toString()}`,
        true
      );

      return this.mapResponse(response);
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      throw error;
    }
  }

  private mapResponse(response: any): AssignmentHistoryResponse {
    return {
      data: (response.data || []).map(this.mapEntry),
      total: response.total || 0,
      page: response.page || 1,
      limit: response.limit || null,
    };
  }

  private mapEntry = (data: any): AssignmentHistoryEntry => {
    return {
      id: data.id,
      userId: data.userId,
      entityId: data.entityId,
      entityName: data.entityName || data.entity?.name || 'Unknown',
      entityType: data.entityType as 'AREA' | 'WAREHOUSE',
      action: data.action as 'ASSIGNED' | 'REMOVED',
      performedBy: data.performedById,
      performedByName: data.performedByName || data.performer?.name || 'Unknown',
      timestamp: new Date(data.timestamp || data.createdAt),
      tenantId: data.tenantId || '',
    };
  };
}
```

**Archivo MODIFICAR:** `src/presentation/providers/RepositoryProvider.tsx`
```typescript
// Agregar import
import { IAssignmentHistoryRepository } from '@/domain/repositories/IAssignmentHistoryRepository';
import { ApiAssignmentHistoryRepository } from '@/infrastructure/repositories/ApiAssignmentHistoryRepository';

// Agregar a interface Repositories
interface Repositories {
  // ... otros repositorios
  assignmentHistoryRepo: IAssignmentHistoryRepository;
}

// Agregar instanciación
const assignmentHistoryRepo = new ApiAssignmentHistoryRepository();

// Agregar al value del provider
value={{
  repositories: {
    // ... otros repos
    assignmentHistoryRepo,
  }
}}
```

#### 3️⃣ Application Layer (Hooks)

**Archivo NUEVO:** `src/hooks/useAssignmentHistory.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';
import { GetAssignmentHistoryFilters } from '@/domain/repositories/IAssignmentHistoryRepository';

// Query keys
export const assignmentHistoryKeys = {
  all: ['assignment-history'] as const,
  byUser: (userId: string) => [...assignmentHistoryKeys.all, 'user', userId] as const,
  global: (filters?: GetAssignmentHistoryFilters) => 
    [...assignmentHistoryKeys.all, 'global', filters] as const,
};

/**
 * Hook para obtener el historial de asignaciones de un usuario específico
 * 
 * @example
 * const { data, isLoading } = useAssignmentHistory('user-id-123');
 */
export const useAssignmentHistory = (
  userId: string,
  page: number = 1,
  limit?: number,
  options?: { enabled?: boolean }
) => {
  const { assignmentHistoryRepo } = useRepositories();

  return useQuery({
    queryKey: assignmentHistoryKeys.byUser(userId),
    queryFn: () => assignmentHistoryRepo.findByUserId(userId, page, limit),
    enabled: options?.enabled !== false && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

/**
 * Hook para obtener el historial global de asignaciones (solo Admin)
 */
export const useGlobalAssignmentHistory = (
  filters?: GetAssignmentHistoryFilters,
  options?: { enabled?: boolean }
) => {
  const { assignmentHistoryRepo } = useRepositories();

  return useQuery({
    queryKey: assignmentHistoryKeys.global(filters),
    queryFn: () => assignmentHistoryRepo.findAll(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
  });
};
```

#### 4️⃣ Presentation Layer (Componentes)

**Archivo NUEVO:** `src/presentation/components/AssignmentHistoryList.tsx`
```typescript
"use client";

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AssignmentHistoryEntry } from '@/domain/entities/AssignmentHistory';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Warehouse, UserPlus, UserMinus } from 'lucide-react';

interface AssignmentHistoryListProps {
  entries: AssignmentHistoryEntry[];
  isLoading?: boolean;
}

export function AssignmentHistoryList({ 
  entries, 
  isLoading = false 
}: AssignmentHistoryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay historial de asignaciones para este usuario.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const Icon = entry.action === 'ASSIGNED' ? UserPlus : UserMinus;
        const TypeIcon = entry.entityType === 'AREA' ? MapPin : Warehouse;
        const bgColor = entry.action === 'ASSIGNED' 
          ? 'bg-green-50 dark:bg-green-950/20 border-green-200' 
          : 'bg-red-50 dark:bg-red-950/20 border-red-200';
        
        return (
          <div 
            key={entry.id} 
            className={`border rounded-lg p-3 ${bgColor}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <Icon className={`h-5 w-5 mt-0.5 ${
                  entry.action === 'ASSIGNED' ? 'text-green-600' : 'text-red-600'
                }`} />
                <div>
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-sm">
                      {entry.entityName}
                    </p>
                    <Badge 
                      variant={entry.action === 'ASSIGNED' ? 'default' : 'destructive'} 
                      className="text-xs"
                    >
                      {entry.action === 'ASSIGNED' ? 'Asignado' : 'Removido'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {entry.entityType === 'AREA' ? 'Área' : 'Bodega'} • Por {entry.performedByName}
                  </p>
                </div>
              </div>
              <time className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(entry.timestamp), "dd MMM yyyy HH:mm", { locale: es })}
              </time>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Archivo MODIFICAR:** `src/presentation/components/AssignmentsDialog.tsx`
```typescript
// Agregar imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAssignmentHistory } from "@/hooks/useAssignmentHistory";
import { AssignmentHistoryList } from "@/presentation/components/AssignmentHistoryList";
import { History } from "lucide-react";

// Dentro del componente, agregar después de definir form:
const { data: historyData, isLoading: loadingHistory } = useAssignmentHistory(user.id);
const assignmentHistory = historyData?.data || [];

// Reemplazar el Form por Tabs (línea ~220):
<Tabs defaultValue="assignments" className="w-full">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="assignments">Asignaciones</TabsTrigger>
    <TabsTrigger value="history">
      <History className="h-4 w-4 mr-2" />
      Historial
    </TabsTrigger>
  </TabsList>

  <TabsContent value="assignments" className="space-y-4">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* TODO EL CONTENIDO ACTUAL DEL FORM */}
      </form>
    </Form>
  </TabsContent>

  <TabsContent value="history">
    <div className="py-4">
      <AssignmentHistoryList 
        entries={assignmentHistory} 
        isLoading={loadingHistory} 
      />
    </div>
  </TabsContent>
</Tabs>
```

### Dependencias Backend REQUERIDAS

#### 1. Tabla en Base de Datos

**Prisma Schema:**
```prisma
model AssignmentHistory {
  id            String   @id @default(uuid())
  userId        String   // Usuario afectado
  entityId      String   // ID de área o bodega
  entityType    String   // 'AREA' | 'WAREHOUSE'
  action        String   // 'ASSIGNED' | 'REMOVED'
  performedById String   // Quién realizó la acción
  timestamp     DateTime @default(now())
  tenantId      String?
  
  user          User     @relation("AssignmentHistoryUser", fields: [userId], references: [id])
  performedBy   User     @relation("AssignmentHistoryPerformer", fields: [performedById], references: [id])
  
  @@index([userId])
  @@index([performedById])
  @@index([entityId, entityType])
  @@index([timestamp])
  @@map("assignment_history")
}
```

**Migración SQL:**
```sql
CREATE TABLE assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  entity_id UUID NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  performed_by_id UUID NOT NULL REFERENCES users(id),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tenant_id UUID,
  INDEX idx_user_id (user_id),
  INDEX idx_performed_by (performed_by_id),
  INDEX idx_entity (entity_id, entity_type),
  INDEX idx_timestamp (timestamp)
);
```

#### 2. Endpoints Backend

**GET `/assignment-history/user/{userId}`**
```typescript
// backend/src/controllers/assignmentHistoryController.ts
export async function getUserAssignmentHistory(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const take = parseInt(limit as string);
    const skip = (parseInt(page as string) - 1) * take;

    const [data, total] = await Promise.all([
      prisma.assignmentHistory.findMany({
        where: { userId },
        include: {
          performedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        take,
        skip
      }),
      prisma.assignmentHistory.count({ where: { userId } })
    ]);

    // Enriquecer con nombres de entidades
    const enrichedData = await Promise.all(
      data.map(async (entry) => {
        let entityName = 'Unknown';
        
        if (entry.entityType === 'AREA') {
          const area = await prisma.area.findUnique({ 
            where: { id: entry.entityId } 
          });
          entityName = area?.name || entry.entityId;
        } else if (entry.entityType === 'WAREHOUSE') {
          const warehouse = await prisma.warehouse.findUnique({ 
            where: { id: entry.entityId } 
          });
          entityName = warehouse?.name || entry.entityId;
        }

        return {
          ...entry,
          entityName,
          performedByName: `${entry.performedBy.firstName} ${entry.performedBy.lastName}`
        };
      })
    );

    res.json({
      data: enrichedData,
      total,
      page: parseInt(page as string),
      limit: take
    });
  } catch (error: any) {
    console.error('Error fetching assignment history:', error);
    res.status(500).json({ error: 'Error al obtener historial de asignaciones' });
  }
}
```

**GET `/assignment-history`** (Admin only)
```typescript
export async function getAssignmentHistory(req: Request, res: Response) {
  try {
    const { userId, entityType, action, from, to, page = 1, limit } = req.query;

    const where: any = {};
    
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from as string);
      if (to) where.timestamp.lte = new Date(to as string);
    }

    const take = limit ? parseInt(limit as string) : undefined;
    const skip = take ? (parseInt(page as string) - 1) * take : 0;

    const [data, total] = await Promise.all([
      prisma.assignmentHistory.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          performedBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        take,
        skip
      }),
      prisma.assignmentHistory.count({ where })
    ]);

    res.json({
      data,
      total,
      page: parseInt(page as string),
      limit: take || null
    });
  } catch (error: any) {
    console.error('Error fetching assignment history:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
}
```

#### 3. Integración en Operaciones de Asignación

**En cada operación de asignación/remoción, agregar:**

```typescript
// Después de asignar área/bodega exitosamente:
await prisma.assignmentHistory.create({
  data: {
    userId: targetUserId,
    entityId: areaId || warehouseId,
    entityType: areaId ? 'AREA' : 'WAREHOUSE',
    action: 'ASSIGNED',
    performedById: req.user.id,
    tenantId: req.user.tenantId
  }
});

// Después de remover área/bodega:
await prisma.assignmentHistory.create({
  data: {
    userId: targetUserId,
    entityId: areaId || warehouseId,
    entityType: areaId ? 'AREA' : 'WAREHOUSE',
    action: 'REMOVED',
    performedById: req.user.id,
    tenantId: req.user.tenantId
  }
});
```

### Checklist de Implementación

- [ ] **Backend:**
  - [ ] Crear migración para tabla `assignment_history`
  - [ ] Implementar controller `assignmentHistoryController.ts`
  - [ ] Agregar rutas en `routes/assignmentHistoryRoutes.ts`
  - [ ] Integrar registro en todas las operaciones de asignación
  - [ ] Probar endpoints con Postman

- [ ] **Frontend:**
  - [ ] Crear entidad `AssignmentHistory.ts`
  - [ ] Crear repositorio interface `IAssignmentHistoryRepository.ts`
  - [ ] Implementar `ApiAssignmentHistoryRepository.ts`
  - [ ] Agregar a `RepositoryProvider.tsx`
  - [ ] Crear hook `useAssignmentHistory.ts`
  - [ ] Crear componente `AssignmentHistoryList.tsx`
  - [ ] Modificar `AssignmentsDialog.tsx` con tabs
  - [ ] Probar flujo completo

- [ ] **Testing:**
  - [ ] Asignar área a jefe → verificar historial
  - [ ] Remover área → verificar historial
  - [ ] Asignar bodega a supervisor → verificar historial
  - [ ] Verificar que se muestra performedBy correctamente
  - [ ] Verificar ordenamiento por fecha (más recientes primero)

### Estimación
**Tiempo total:** 4-6 horas
- Backend: 2-3 horas
- Frontend: 2-3 horas

---

## ⏳ FASE 3: Historial de Área

### Objetivo
Mostrar historial de modificaciones en la vista de detalle de cada área (cambios de jefes, bodegas asignadas/removidas).

### TODO Principal
**#19 & #23: Mostrar historial en detalle de área**

### Requerimiento Relacionado
- **ID:** `AREA-3` - Asignar jefe de área
- **Extracto:** *"Al asignar un jefe, se debe actualizar la fecha de modificación del área, permitiendo el seguimiento histórico de asignaciones."*

### Arquitectura Propuesta

#### 1️⃣ Application Layer (Hook)

**Archivo NUEVO:** `src/hooks/useAreaHistory.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/infrastructure/api/apiClient';
import { AssignmentHistoryEntry } from '@/domain/entities/AssignmentHistory';

export const areaHistoryKeys = {
  all: ['area-history'] as const,
  byArea: (areaId: string) => [...areaHistoryKeys.all, 'area', areaId] as const,
};

/**
 * Hook para obtener el historial de un área específica
 * (asignaciones de jefes y bodegas)
 */
export const useAreaHistory = (areaId: string) => {
  return useQuery({
    queryKey: areaHistoryKeys.byArea(areaId),
    queryFn: async () => {
      const response = await apiClient.get<any[]>(
        `/areas/${areaId}/history`,
        true
      );
      
      return response.map(entry => ({
        ...entry,
        timestamp: new Date(entry.timestamp || entry.createdAt)
      }));
    },
    enabled: !!areaId,
    staleTime: 1000 * 60 * 5,
  });
};
```

#### 2️⃣ Presentation Layer

**Archivo MODIFICAR:** `src/presentation/views/AreaDetailView.tsx`
```typescript
// Agregar imports
import { useAreaHistory } from "@/hooks/useAreaHistory";
import { AssignmentHistoryList } from "@/presentation/components/AssignmentHistoryList";
import { History } from "lucide-react";

// En el componente, después de cargar data:
const { data: historyEntries = [], isLoading: loadingHistory } = useAreaHistory(areaId);

// Convertir al formato esperado por AssignmentHistoryList:
const formattedHistory: AssignmentHistoryEntry[] = historyEntries.map(entry => ({
  id: entry.id,
  userId: entry.userId,
  entityId: entry.entityId,
  entityName: entry.entityName,
  entityType: entry.entityType,
  action: entry.action,
  performedBy: entry.performedById,
  performedByName: entry.performedByName,
  timestamp: entry.timestamp,
  tenantId: entry.tenantId || ''
}));

// En el render, modificar TabsList (línea ~335):
<TabsList className="grid w-full grid-cols-4"> {/* Cambia de 3 a 4 */}
  <TabsTrigger value="overview">
    <Building2 className="mr-2 h-4 w-4" />
    Información
  </TabsTrigger>
  <TabsTrigger value="warehouses">
    <Warehouse className="mr-2 h-4 w-4" />
    Bodegas ({assignedWarehouses.length})
  </TabsTrigger>
  <TabsTrigger value="managers">
    <UserCog className="mr-2 h-4 w-4" />
    Jefes ({assignedManagers.length})
  </TabsTrigger>
  <TabsTrigger value="history">
    <History className="mr-2 h-4 w-4" />
    Historial
  </TabsTrigger>
</TabsList>

// Después de TabsContent de managers:
<TabsContent value="history" className="space-y-4">
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <History className="h-5 w-5" />
        Historial de Modificaciones
      </CardTitle>
    </CardHeader>
    <CardContent>
      <AssignmentHistoryList 
        entries={formattedHistory} 
        isLoading={loadingHistory} 
      />
    </CardContent>
  </Card>
</TabsContent>
```

### Dependencias Backend REQUERIDAS

**Endpoint:** `GET /areas/{areaId}/history`

```typescript
// backend/src/controllers/areaController.ts
export async function getAreaHistory(req: Request, res: Response) {
  try {
    const { areaId } = req.params;
    const { limit = 50 } = req.query;

    // Obtener historial de asignaciones relacionadas al área
    const history = await prisma.assignmentHistory.findMany({
      where: {
        OR: [
          // Jefes asignados/removidos del área
          { entityId: areaId, entityType: 'AREA' },
          // Bodegas asignadas/removidas (via warehouse.areaId)
          {
            entityType: 'WAREHOUSE',
            entityId: {
              in: (await prisma.warehouse.findMany({
                where: { areaId },
                select: { id: true }
              })).map(w => w.id)
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        performedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string)
    });

    // Enriquecer con detalles de entidades
    const enrichedHistory = await Promise.all(
      history.map(async (entry) => {
        let entityName = 'Unknown';

        if (entry.entityType === 'AREA') {
          const area = await prisma.area.findUnique({ 
            where: { id: entry.entityId } 
          });
          entityName = area?.name || entry.entityId;
        } else if (entry.entityType === 'WAREHOUSE') {
          const warehouse = await prisma.warehouse.findUnique({ 
            where: { id: entry.entityId } 
          });
          entityName = warehouse?.name || entry.entityId;
        }

        return {
          ...entry,
          entityName,
          performedByName: `${entry.performedBy.firstName} ${entry.performedBy.lastName}`,
          userName: `${entry.user.firstName} ${entry.user.lastName}`
        };
      })
    );

    res.json(enrichedHistory);
  } catch (error: any) {
    console.error('Error fetching area history:', error);
    res.status(500).json({ error: 'Error al obtener historial del área' });
  }
}
```

**Ruta:**
```typescript
// backend/src/routes/areaRoutes.ts
router.get(
  '/areas/:areaId/history',
  authenticate,
  authorize(['ADMIN', 'JEFE', 'JEFE_AREA']),
  getAreaHistory
);
```

### Checklist de Implementación

- [ ] **Backend:**
  - [ ] Implementar `getAreaHistory` en `areaController.ts`
  - [ ] Agregar ruta en `areaRoutes.ts`
  - [ ] Probar con Postman

- [ ] **Frontend:**
  - [ ] Crear hook `useAreaHistory.ts`
  - [ ] Modificar `AreaDetailView.tsx` (agregar tab)
  - [ ] Probar flujo completo

- [ ] **Testing:**
  - [ ] Asignar jefe a área → verificar historial
  - [ ] Asignar bodega a área → verificar historial
  - [ ] Remover jefe → verificar historial
  - [ ] Verificar ordenamiento correcto

### Estimación
**Tiempo total:** 2-3 horas
- Backend: 1-1.5 horas
- Frontend: 1-1.5 horas

---

## ⏳ FASE 4: Validación Backend Área-Bodega

### Objetivo
Validar en backend que un Jefe solo puede asignar supervisores a bodegas dentro de sus áreas asignadas.

### TODO Principal
**#12: Validar bodega pertenece al área del Jefe (Backend)**

### Requerimiento Relacionado
- **ID:** `USR-005` - Modificar Asignaciones
- **Extracto:** *"El sistema debe impedir asignar bodegas que no pertenezcan al área del Jefe que realiza la asignación."*

### Arquitectura Propuesta

#### Backend Únicamente

**Archivo MODIFICAR:** `backend/src/controllers/assignmentController.ts`

```typescript
/**
 * POST /warehouses/{warehouseId}/supervisors
 * Asignar supervisor a bodega (solo Jefe que tenga el área)
 */
export async function assignSupervisorToWarehouse(req: Request, res: Response) {
  try {
    const { warehouseId } = req.params;
    const { supervisorId } = req.body;
    const managerId = req.user?.id;
    const role = req.user?.role?.name;

    // ✅ Validar que el usuario sea JEFE
    if (role !== 'JEFE' && role !== 'JEFE_AREA') {
      return res.status(403).json({ 
        error: 'Solo los Jefes de Área pueden asignar supervisores' 
      });
    }

    // ✅ Obtener bodega con su área
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: { area: true }
    });

    if (!warehouse) {
      return res.status(404).json({ error: 'Bodega no encontrada' });
    }

    if (!warehouse.areaId) {
      return res.status(400).json({ 
        error: 'La bodega no está asignada a ningún área' 
      });
    }

    // ✅ VALIDACIÓN CRÍTICA: Verificar que el Jefe tenga asignada el área
    const managerAreaAssignment = await prisma.assignment.findFirst({
      where: {
        userId: managerId,
        areaId: warehouse.areaId,
        isActive: true,
        revokedAt: null
      }
    });

    if (!managerAreaAssignment) {
      return res.status(403).json({ 
        error: `No tienes permiso para asignar supervisores a bodegas del área "${warehouse.area?.name}". Solo puedes asignar en tus áreas asignadas.`
      });
    }

    // ✅ Verificar que el supervisor existe y tiene rol SUPERVISOR
    const supervisor = await prisma.user.findUnique({
      where: { id: supervisorId },
      include: { role: true }
    });

    if (!supervisor) {
      return res.status(404).json({ error: 'Supervisor no encontrado' });
    }

    if (supervisor.role?.name !== 'SUPERVISOR') {
      return res.status(400).json({ 
        error: 'El usuario debe tener rol SUPERVISOR' 
      });
    }

    if (!supervisor.isEnabled) {
      return res.status(400).json({ 
        error: 'El supervisor está deshabilitado' 
      });
    }

    // ✅ Verificar si ya existe asignación activa
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        userId: supervisorId,
        warehouseId: warehouseId,
        isActive: true,
        revokedAt: null
      }
    });

    if (existingAssignment) {
      return res.status(409).json({ 
        error: 'El supervisor ya está asignado a esta bodega' 
      });
    }

    // ✅ Crear asignación
    const assignment = await prisma.assignment.create({
      data: {
        userId: supervisorId,
        warehouseId: warehouseId,
        assignedBy: managerId,
        isActive: true,
        tenantId: req.user?.tenantId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        warehouse: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // ✅ Registrar en historial (si Fase 2 implementada)
    if (prisma.assignmentHistory) {
      await prisma.assignmentHistory.create({
        data: {
          userId: supervisorId,
          entityId: warehouseId,
          entityType: 'WAREHOUSE',
          action: 'ASSIGNED',
          performedById: managerId,
          tenantId: req.user?.tenantId
        }
      });
    }

    res.status(201).json(assignment);
  } catch (error: any) {
    console.error('Error assigning supervisor to warehouse:', error);
    res.status(500).json({ error: 'Error al asignar supervisor a la bodega' });
  }
}
```

**Ruta:**
```typescript
// backend/src/routes/warehouseRoutes.ts
router.post(
  '/warehouses/:warehouseId/supervisors',
  authenticate,
  authorize(['JEFE', 'JEFE_AREA', 'ADMIN']),
  assignSupervisorToWarehouse
);
```

### Frontend (Sin Cambios)

El frontend ya filtra las bodegas correctamente en `AssignmentsDialog.tsx`:

```typescript
// Línea 141-143 (ya implementado):
if (userRole === USER_ROLES.JEFE && userAreaIds.length > 0 && !isEditingSupervisor) {
  filteredWarehouses = filteredWarehouses.filter(w => 
    w.areaId && userAreaIds.includes(w.areaId)
  );
}
```

**Pero ahora el backend agregará validación de seguridad final.**

### Checklist de Implementación

- [ ] **Backend:**
  - [ ] Modificar `assignSupervisorToWarehouse` en `assignmentController.ts`
  - [ ] Agregar validación de área del Jefe
  - [ ] Probar con Postman (caso válido e inválido)
  - [ ] Verificar mensajes de error claros

- [ ] **Testing:**
  - [ ] Jefe asigna supervisor a bodega de SU área → OK
  - [ ] Jefe intenta asignar a bodega de OTRA área → 403 Forbidden
  - [ ] Admin puede asignar a cualquier bodega → OK
  - [ ] Verificar mensaje de error descriptivo

### Estimación
**Tiempo total:** 1-2 horas
- Backend: 1-2 horas (incluye testing)
- Frontend: 0 horas (ya implementado)

---

## ⏳ FASE 5: Revocar Asignaciones al Deshabilitar Jefe

### Objetivo
Cuando se deshabilita un Jefe de Área, revocar automáticamente todas las asignaciones de supervisores a bodegas dentro de sus áreas.

### TODO Principal
**#18: Revocar asignaciones al deshabilitar Jefe**

### Requerimiento Relacionado
- **ID:** `AREA-3` - Asignar jefe de área
- **Extracto:** *"El estado del jefe debe ser 'Habilitado' para asignarlo a un área correspondiente. En caso de que este deje de estar habilitado, **no se mantienen sus asignaciones previas**."*

### Arquitectura Propuesta

#### Backend Únicamente

**Archivo MODIFICAR:** `backend/src/controllers/userController.ts`

```typescript
/**
 * PUT /users/{userId}
 * Actualizar usuario (con lógica de revocación de asignaciones)
 */
export async function updateUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { isEnabled, ...otherUpdates } = req.body;
    const performedBy = req.user?.id;

    // ✅ Obtener usuario actual
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // ✅ LÓGICA CRÍTICA: Si se deshabilita un Jefe, revocar asignaciones
    if (
      isEnabled === false && 
      currentUser.isEnabled === true &&
      (currentUser.role?.name === 'JEFE' || currentUser.role?.name === 'JEFE_AREA')
    ) {
      console.log(`⚠️ Disabling manager ${userId}, revoking subordinate assignments...`);

      // 1. Obtener áreas del jefe
      const managerAreas = await prisma.assignment.findMany({
        where: {
          userId: userId,
          areaId: { not: null },
          isActive: true,
          revokedAt: null
        },
        select: { areaId: true }
      });

      const areaIds = managerAreas
        .map(a => a.areaId)
        .filter((id): id is string => id !== null);

      if (areaIds.length > 0) {
        // 2. Obtener bodegas en esas áreas
        const warehouses = await prisma.warehouse.findMany({
          where: { areaId: { in: areaIds } },
          select: { id: true, name: true }
        });

        const warehouseIds = warehouses.map(w => w.id);

        if (warehouseIds.length > 0) {
          // 3. Obtener asignaciones activas de supervisores en esas bodegas
          const assignmentsToRevoke = await prisma.assignment.findMany({
            where: {
              warehouseId: { in: warehouseIds },
              isActive: true,
              revokedAt: null
            },
            select: { id: true, userId: true, warehouseId: true }
          });

          // 4. Revocar asignaciones
          await prisma.assignment.updateMany({
            where: {
              warehouseId: { in: warehouseIds },
              isActive: true,
              revokedAt: null
            },
            data: {
              isActive: false,
              revokedAt: new Date(),
              revokedBy: performedBy
            }
          });

          console.log(`✅ Revoked ${assignmentsToRevoke.length} supervisor assignments`);

          // 5. Registrar en historial (si Fase 2 implementada)
          if (prisma.assignmentHistory) {
            const historyEntries = assignmentsToRevoke.map(assignment => ({
              userId: assignment.userId,
              entityId: assignment.warehouseId!,
              entityType: 'WAREHOUSE',
              action: 'REMOVED',
              performedById: performedBy || userId,
              timestamp: new Date(),
              tenantId: req.user?.tenantId
            }));

            await prisma.assignmentHistory.createMany({
              data: historyEntries
            });
          }
        }
      }
    }

    // ✅ Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isEnabled,
        ...otherUpdates,
        updatedAt: new Date()
      },
      include: {
        role: true,
        areaAssignments: {
          where: { isActive: true },
          include: { area: true }
        },
        warehouseAssignments: {
          where: { isActive: true },
          include: { warehouse: true }
        }
      }
    });

    // ✅ Registrar en UserEnablementHistory
    if (isEnabled !== undefined && isEnabled !== currentUser.isEnabled) {
      await prisma.userEnablementHistory.create({
        data: {
          userId: userId,
          action: isEnabled ? 'ENABLED' : 'DISABLED',
          performedById: performedBy || userId,
          reason: isEnabled 
            ? 'Usuario rehabilitado' 
            : 'Usuario deshabilitado - Asignaciones de supervisores revocadas',
          occurredAt: new Date()
        }
      });
    }

    res.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
}
```

### Frontend (Sin Cambios)

El frontend ya maneja correctamente el toggle de usuario en `useUsers.ts`:

```typescript
// src/application/usecases/user/ToggleUserStatus.ts (ya simplificado)
async execute(params: {
  targetUserId: string;
  newStatus: "HABILITADO" | "DESHABILITADO";
  performedBy: string;
  tenantId: string;
}): Promise<Result<User>> {
  // Solo actualiza estado, backend maneja revocaciones
  const updated = await this.userRepo.update(
    params.targetUserId,
    { status: params.newStatus },
    params.tenantId
  );
  return { ok: true, value: updated };
}
```

**El backend ahora manejará la revocación automáticamente.**

### Checklist de Implementación

- [ ] **Backend:**
  - [ ] Modificar `updateUser` en `userController.ts`
  - [ ] Implementar lógica de revocación en cascada
  - [ ] Registrar en historial (si Fase 2 implementada)
  - [ ] Agregar logs para debugging
  - [ ] Probar con Postman

- [ ] **Testing:**
  - [ ] Crear Jefe con 2 áreas asignadas
  - [ ] Asignar supervisores a bodegas de esas áreas
  - [ ] Deshabilitar Jefe
  - [ ] Verificar que asignaciones de supervisores se revocaron (`isActive: false`)
  - [ ] Verificar que historial registra las revocaciones
  - [ ] Habilitar Jefe nuevamente
  - [ ] Verificar que NO se restauran asignaciones automáticamente

- [ ] **Casos Edge:**
  - [ ] Jefe sin áreas → no hace nada
  - [ ] Área sin bodegas → no hace nada
  - [ ] Bodega sin supervisores → no hace nada
  - [ ] Admin deshabilita Jefe → funciona igual

### Estimación
**Tiempo total:** 3-4 horas
- Backend: 2-3 horas (lógica compleja)
- Testing: 1 hora (casos críticos)

---

## 🎯 FASE 6: Testing End-to-End (Futura)

### Objetivo
Implementar tests automatizados para garantizar la calidad y evitar regresiones.

### Tipos de Tests

#### 1. Unit Tests (Jest + Testing Library)

**Repositorios:**
```typescript
// tests/infrastructure/repositories/ApiAssignmentHistoryRepository.test.ts
describe('ApiAssignmentHistoryRepository', () => {
  it('should fetch user assignment history', async () => {
    // Mock apiClient
    // Test findByUserId
    // Verify mapping
  });

  it('should handle errors gracefully', async () => {
    // Test error handling
  });
});
```

**Use Cases:**
```typescript
// tests/application/usecases/user/ToggleUserStatus.test.ts
describe('ToggleUserStatus', () => {
  it('should toggle user status successfully', async () => {
    // Mock userRepo
    // Execute use case
    // Verify result
  });
});
```

**Componentes:**
```typescript
// tests/presentation/components/AssignmentHistoryList.test.tsx
describe('AssignmentHistoryList', () => {
  it('should render assignment history entries', () => {
    render(<AssignmentHistoryList entries={mockEntries} />);
    expect(screen.getByText('Bodega Norte')).toBeInTheDocument();
  });

  it('should show loading skeleton', () => {
    render(<AssignmentHistoryList entries={[]} isLoading={true} />);
    expect(screen.getAllByTestId('skeleton')).toHaveLength(5);
  });
});
```

#### 2. Integration Tests (Playwright)

```typescript
// e2e/assignment-history.spec.ts
test('should display assignment history in user dialog', async ({ page }) => {
  await page.goto('/users');
  await page.click('text=Juan Pérez');
  await page.click('text=Historial');
  
  await expect(page.locator('.assignment-history-entry')).toHaveCount(5);
  await expect(page.locator('text=Bodega Norte')).toBeVisible();
});

test('should revoke assignments when disabling manager', async ({ page }) => {
  // Login as admin
  // Navigate to users
  // Disable manager
  // Verify supervisors unassigned
});
```

#### 3. API Tests (Supertest)

```typescript
// tests/api/assignmentHistory.test.ts
describe('GET /assignment-history/user/:userId', () => {
  it('should return user assignment history', async () => {
    const response = await request(app)
      .get('/assignment-history/user/user-123')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(10);
    expect(response.body.total).toBeGreaterThan(0);
  });

  it('should require authentication', async () => {
    const response = await request(app)
      .get('/assignment-history/user/user-123');

    expect(response.status).toBe(401);
  });
});
```

### Checklist de Testing

- [ ] **Unit Tests:**
  - [ ] Repositorios (mapeo, errores)
  - [ ] Use cases (lógica de negocio)
  - [ ] Componentes (render, interacción)
  - [ ] Hooks (queries, mutations)

- [ ] **Integration Tests:**
  - [ ] Flujo completo de asignaciones
  - [ ] Historial de usuario
  - [ ] Historial de área
  - [ ] Revocación al deshabilitar

- [ ] **API Tests:**
  - [ ] Endpoints de historial
  - [ ] Validaciones de seguridad
  - [ ] Manejo de errores

- [ ] **Coverage:**
  - [ ] Mínimo 80% en domain/application
  - [ ] Mínimo 70% en infrastructure
  - [ ] Mínimo 60% en presentation

### Estimación
**Tiempo total:** 8-12 horas
- Setup de testing: 2 horas
- Unit tests: 3-4 horas
- Integration tests: 3-4 horas
- API tests: 2-3 horas

---

## 📋 Resumen de Fases

| Fase | TODOs | Backend | Frontend | Tiempo | Prioridad |
|------|-------|---------|----------|--------|-----------|
| ✅ 0 | #1-9 | ✅ | ✅ | - | CRÍTICO |
| ✅ 1 | #11, #13, #14 | No | ✅ | 2h | MEDIO |
| ⏳ 2 | #10 | Sí | Sí | 4-6h | ALTO |
| ⏳ 3 | #19, #23 | Sí | Sí | 2-3h | MEDIO |
| ⏳ 4 | #12 | Sí | No | 1-2h | MEDIO |
| ⏳ 5 | #18 | Sí | No | 3-4h | ALTO |
| 🎯 6 | Testing | Parcial | Sí | 8-12h | BAJO |

**Total estimado:** 20-29 horas

---

## 🎯 Orden Recomendado de Implementación

### Opción A: Por Dependencias (Recomendado)
```
1. Fase 2 (Historial Asignaciones) → Base para Fase 3 y 5
2. Fase 4 (Validación Backend) → Rápida, mejora seguridad
3. Fase 5 (Revocar Asignaciones) → Usa historial de Fase 2
4. Fase 3 (Historial Área) → Usa infraestructura de Fase 2
5. Fase 6 (Testing) → Valida todo
```

### Opción B: Por Impacto en Usuario
```
1. Fase 2 (Historial Asignaciones) → Más visible para usuarios
2. Fase 3 (Historial Área) → Complementa Fase 2
3. Fase 5 (Revocar Asignaciones) → Cumple requerimiento AREA-3
4. Fase 4 (Validación Backend) → Seguridad adicional
5. Fase 6 (Testing) → Calidad final
```

### Opción C: Por Complejidad Creciente
```
1. Fase 4 (Validación Backend) → Más simple
2. Fase 3 (Historial Área) → Media
3. Fase 2 (Historial Asignaciones) → Media-Alta
4. Fase 5 (Revocar Asignaciones) → Alta
5. Fase 6 (Testing) → Alta
```

---

## 📞 Cómo Usar Este Documento

### Para Implementar una Fase Completa:
```
Usuario: "Implementa la Fase 2 completa"
→ Copilot creará todos los archivos y modificaciones necesarias
```

### Para Consultar Detalles:
```
Usuario: "¿Qué endpoints backend necesita la Fase 3?"
→ Copilot explicará solo esa sección
```

### Para Implementación Parcial:
```
Usuario: "Solo el frontend de la Fase 2"
→ Copilot implementará solo archivos de frontend
```

### Para Verificación:
```
Usuario: "¿La Fase 2 está lista para implementar?"
→ Copilot revisará dependencias y confirmará
```

---

## ✅ Checklist General de Calidad

Antes de marcar una fase como completa:

- [ ] **Código:**
  - [ ] Sin errores TypeScript
  - [ ] Respeta Clean Architecture
  - [ ] Sigue convenciones del proyecto
  - [ ] Comentarios en lógica compleja

- [ ] **Backend:**
  - [ ] Migraciones de BD ejecutadas
  - [ ] Endpoints documentados
  - [ ] Validaciones implementadas
  - [ ] Logs para debugging

- [ ] **Frontend:**
  - [ ] Componentes reutilizables
  - [ ] Hooks correctamente implementados
  - [ ] Estados de loading/error
  - [ ] UX consistente

- [ ] **Testing:**
  - [ ] Probado manualmente
  - [ ] Casos edge verificados
  - [ ] Regresiones descartadas

- [ ] **Documentación:**
  - [ ] Checklist actualizado
  - [ ] README actualizado (si aplica)
  - [ ] Comentarios en código

---

**Última actualización:** 2025-12-12  
**Mantenido por:** GitHub Copilot (Claude Sonnet 4.5)  
**Estado:** Listo para ejecución por fases
