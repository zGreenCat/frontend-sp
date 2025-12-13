# ✅ Checklist de Implementación - Auditoría de Requerimientos

**Fecha de inicio:** 2025-01-XX
**Objetivo:** Convertir todos los TODOs del reporte de auditoría en código ejecutable

---

## 📊 Resumen Ejecutivo

| Categoría | Total | Completado | En Progreso | Pendiente |
|-----------|-------|------------|-------------|-----------|
| 🔴 CRÍTICO | 5 | 5 | 0 | 0 |
| 🟡 MEDIO | 10 | 4 | 0 | 6 |
| 🟢 BAJO | 2 | 0 | 0 | 2 |
| **TOTAL** | **17** | **9** | **0** | **8** |

**Progreso General:** 53% (9/17)

---

## 🔴 TODOs CRÍTICOS (5/5 - 100%)

### ✅ TODO #1: Supervisores bloqueados de lista de usuarios
- **Estado:** ✅ COMPLETADO (Pre-existente)
- **Prioridad:** 🔴 CRÍTICO
- **Categoría:** Seguridad/Permisos
- **Archivo:** `src/presentation/views/UsersView.tsx`
- **Cambios:**
  - Filtro por jerarquía ya implementado (líneas 440-475)
  - ADMIN ve todos, JEFE ve asignados, SUPERVISOR no accede
- **Verificación:** ✅ Código verificado - implementación correcta

---

### ✅ TODO #8: Login valida mensaje específico para usuarios deshabilitados
- **Estado:** ✅ COMPLETADO (Pre-existente)
- **Prioridad:** 🔴 CRÍTICO
- **Categoría:** UX/Seguridad
- **Archivo:** `src/infrastructure/services/authService.ts`
- **Cambios:**
  - Validación de status "DESHABILITADO" ya implementada
  - Mensaje: "Su cuenta ha sido deshabilitada"
- **Verificación:** ✅ Código verificado - throw error con mensaje correcto

---

### ✅ TODO #15: Validar área sea nodo hoja para asignar bodegas
- **Estado:** ✅ COMPLETADO (Nuevo - 2025-01-XX)
- **Prioridad:** 🔴 CRÍTICO
- **Categoría:** Lógica de Negocio
- **Archivos modificados:**
  - `src/presentation/views/AreaDetailView.tsx` (líneas 78-92, 358)
- **Cambios aplicados:**
  ```typescript
  // Validación memoizada
  const isLeafNode = useMemo(() => {
    return childAreas.length === 0;
  }, [childAreas]);

  // Handler con validación
  const handleOpenWarehousesDialog = () => {
    if (!isLeafNode) {
      toast({
        title: "Operación no permitida",
        description: "Solo puedes asignar bodegas a áreas sin sub-áreas (nodos hoja)",
        variant: "destructive"
      });
      return;
    }
    setWarehousesDialogOpen(true);
  };
  ```
- **Verificación:** ✅ Sin errores TypeScript, toast implementado correctamente

---

### ✅ TODO #17: Solo gerentes habilitados pueden ser asignados
- **Estado:** ✅ COMPLETADO (Pre-existente)
- **Prioridad:** 🔴 CRÍTICO
- **Categoría:** Validación de Negocio
- **Archivo:** `src/presentation/components/AssignmentsDialog.tsx`
- **Cambios:**
  - Filtro de usuarios habilitados ya implementado
  - `managerOptions.filter(u => u.status === "HABILITADO")`
- **Verificación:** ✅ Código verificado - implementación correcta

---

### ✅ TODO #6 & #9: Auditoría de cambios de estado
- **Estado:** ✅ COMPLETADO (Nuevo - 2025-01-XX)
- **Prioridad:** 🔴 CRÍTICO
- **Categoría:** Auditoría/Compliance
- **Archivos creados:**
  1. `src/domain/entities/AuditLog.ts` (NUEVO)
  2. `src/domain/repositories/IAuditLogRepository.ts` (NUEVO)
  3. `src/infrastructure/repositories/ApiAuditLogRepository.ts` (NUEVO)

- **Archivos modificados:**
  1. `src/presentation/providers/RepositoryProvider.tsx`
  2. `src/application/usecases/user/ToggleUserStatus.ts`
  3. `src/hooks/useUsers.ts`
  4. `src/presentation/views/UsersView.tsx`

- **Cambios aplicados:**
  
  **1. Domain Layer (Entidades):**
  ```typescript
  // src/domain/entities/AuditLog.ts
  export type AuditAction = 
    | 'USER_ENABLED' 
    | 'USER_DISABLED'
    | 'AREA_CREATED'
    | 'AREA_UPDATED'
    | 'WAREHOUSE_ASSIGNED'
    | 'WAREHOUSE_UNASSIGNED';

  export type AuditEntityType = 'USER' | 'AREA' | 'WAREHOUSE' | 'ASSIGNMENT';

  export interface CreateAuditLogInput {
    entityType: AuditEntityType;
    entityId: string;
    action: AuditAction;
    performedBy: string;
    details?: Record<string, any>;
  }
  ```

  **2. Repository Interface:**
  ```typescript
  // src/domain/repositories/IAuditLogRepository.ts
  export interface IAuditLogRepository {
    create(input: CreateAuditLogInput): Promise<void>;
    findByEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]>;
    findAll(): Promise<AuditLogEntry[]>;
    findByPerformer(performerId: string): Promise<AuditLogEntry[]>;
  }
  ```

  **3. Infrastructure (API Client):**
  ```typescript
  // src/infrastructure/repositories/ApiAuditLogRepository.ts
  export class ApiAuditLogRepository implements IAuditLogRepository {
    async create(input: CreateAuditLogInput): Promise<void> {
      await apiClient.post('/audit-logs', input, true);
    }
    
    async findByEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
      const response = await apiClient.get<any[]>(
        `/audit-logs?entityType=${entityType}&entityId=${entityId}`,
        true
      );
      return response.map(this.mapToAuditLogEntry);
    }
  }
  ```

  **4. Use Case Integration:**
  ```typescript
  // src/application/usecases/user/ToggleUserStatus.ts (líneas 26-42)
  if (this.auditLogRepo) {
    try {
      await this.auditLogRepo.create({
        entityType: 'USER',
        entityId: userId,
        action: newStatus === 'HABILITADO' ? 'USER_ENABLED' : 'USER_DISABLED',
        performedBy,
        details: {
          previousStatus: user.status,
          newStatus,
          userName: `${user.name} ${user.lastName}`,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error logging audit trail:', error);
    }
  }
  ```

  **5. Hook Integration:**
  ```typescript
  // src/hooks/useUsers.ts (líneas 133-149)
  const useToggleUserStatus = () => {
    const { repositories } = useRepositories();
    const { auditLogRepo } = repositories;

    return useMutation({
      mutationFn: async ({
        userId,
        newStatus,
        performedBy, // ← NUEVO PARÁMETRO
        tenantId,
      }: {
        userId: string;
        newStatus: string;
        performedBy: string; // ← TRACKING
        tenantId: string;
      }) => {
        const useCase = new ToggleUserStatus(
          repositories.userRepo,
          auditLogRepo // ← PASAR REPOSITORIO
        );
        await useCase.execute(userId, newStatus, performedBy, tenantId);
      },
    });
  };
  ```

  **6. View Integration:**
  ```typescript
  // src/presentation/views/UsersView.tsx (línea 398)
  await toggleStatusMutation.mutateAsync({
    userId: selectedUser.id,
    newStatus: newStatus,
    performedBy: currentUser?.id || '', // ← TRACKING DE QUIÉN EJECUTA
    tenantId: TENANT_ID,
  });
  ```

- **Backend Requirements:**
  ```sql
  -- Tabla SQL necesaria (PostgreSQL/MySQL)
  CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by UUID NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details JSONB,
    tenant_id UUID,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_performer (performed_by),
    INDEX idx_performed_at (performed_at)
  );
  ```

  **Backend Endpoints Requeridos:**
  - `POST /audit-logs` - Crear registro de auditoría
  - `GET /audit-logs?entityType=X&entityId=Y` - Consultar por entidad
  - `GET /audit-logs?performedBy=userId` - Consultar por ejecutor

- **Verificación:** ✅ Sin errores TypeScript, flujo completo implementado
- **Nota:** ⚠️ Backend pendiente - frontend preparado para integración

---

## 🟡 TODOs MEDIO (4/10 - 40%)

### ✅ TODO #2: Agregar búsqueda por RUT
- **Estado:** ✅ COMPLETADO (Nuevo - 2025-01-XX)
- **Prioridad:** 🟡 MEDIO
- **Categoría:** UX
- **Archivo:** `src/presentation/views/UsersView.tsx`
- **Cambios aplicados:**
  ```typescript
  // Líneas 476-484
  const matchesSearch =
    search === "" ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.lastName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    // ✅ NUEVO: Búsqueda por RUT (normalizada sin puntos ni guiones)
    (u.rut && u.rut.replace(/[.-]/g, '').includes(search.replace(/[.-]/g, '')));
  ```
- **Beneficios:**
  - Búsqueda flexible: acepta RUT con/sin formato (12345678-9 o 123456789)
  - Normalización automática para matching
- **Verificación:** ✅ Sin errores TypeScript

---

### ✅ TODO #3: Mostrar usuarios deshabilitados en rojo
- **Estado:** ✅ COMPLETADO (Nuevo - 2025-01-XX)
- **Prioridad:** 🟡 MEDIO
- **Categoría:** UX
- **Archivo:** `src/presentation/views/UsersView.tsx`
- **Cambios aplicados:**
  
  **Vista Mobile (tarjetas):**
  ```typescript
  // Líneas 686-691
  <div
    key={user.id}
    className={`border border-border rounded-lg p-3 bg-card shadow-sm flex flex-col gap-2 ${
      user.status === "DESHABILITADO" ? "opacity-60 bg-red-50 border-red-200" : ""
    }`}
  >
  ```

  **Vista Desktop (tabla):**
  ```typescript
  // Líneas 945-950
  <tr
    key={user.id}
    className={`border-b border-border hover:bg-secondary/20 transition-colors ${
      user.status === "DESHABILITADO" ? "bg-red-50/50 opacity-70" : ""
    }`}
  >
  ```
- **Beneficios:**
  - Identificación visual inmediata de usuarios deshabilitados
  - Consistencia entre vista mobile y desktop
- **Verificación:** ✅ Sin errores TypeScript

---

### ✅ TODO #4: Deshabilitar botones para usuarios deshabilitados
- **Estado:** ✅ COMPLETADO (Nuevo - 2025-01-XX)
- **Prioridad:** 🟡 MEDIO
- **Categoría:** UX
- **Archivo:** `src/presentation/views/UsersView.tsx`
- **Cambios aplicados:**
  
  **Botón "Modificar Asignaciones" (deshabilitado para usuarios deshabilitados):**
  ```typescript
  // Vista Mobile (líneas 863-875)
  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8"
    onClick={() => openAssignmentsDialog(user)}
    disabled={user.status === "DESHABILITADO"}
  >
    <Pencil className="h-4 w-4 text-primary" />
  </Button>

  // Vista Desktop (líneas 1145-1157)
  <Button
    variant="ghost"
    size="sm"
    onClick={() => openAssignmentsDialog(user)}
    className="h-8 w-8 p-0"
    disabled={user.status === "DESHABILITADO"}
  >
    <Pencil className="h-4 w-4 text-primary" />
  </Button>
  ```

  **Botón "Habilitar/Deshabilitar" (siempre activo):**
  ```typescript
  // Vista Mobile (líneas 880-895) - Sin disabled
  // Vista Desktop (líneas 1162-1177) - Sin disabled
  // ✅ Este botón NO debe estar disabled para permitir RE-habilitar
  ```

- **Beneficios:**
  - Previene modificaciones a usuarios inactivos
  - Permite re-habilitar usuarios deshabilitados
- **Verificación:** ✅ Sin errores TypeScript

---

### ✅ TODO #7: Mensajes específicos en modal de confirmación
- **Estado:** ✅ COMPLETADO (Nuevo - 2025-01-XX)
- **Prioridad:** 🟡 MEDIO
- **Categoría:** UX
- **Archivo:** `src/presentation/views/UsersView.tsx`
- **Cambios aplicados:**
  ```typescript
  // Líneas 1290-1306
  <ConfirmDialog
    open={confirmOpen}
    onOpenChange={setConfirmOpen}
    onConfirm={handleDisable}
    title={
      selectedUser?.status === "HABILITADO"
        ? "¿Deshabilitar usuario?"
        : "¿Habilitar usuario?"
    }
    description={
      selectedUser?.status === "HABILITADO"
        ? `¿Confirma deshabilitar a ${selectedUser?.name} ${selectedUser?.lastName}? No podrá acceder al sistema y sus asignaciones quedarán inactivas.`
        : `¿Confirma habilitar a ${selectedUser?.name} ${selectedUser?.lastName}? Podrá volver a acceder al sistema con sus asignaciones actuales.`
    }
  />
  ```
- **Mejoras:**
  - Mensajes específicos según acción (habilitar vs deshabilitar)
  - Describe consecuencias de la acción
  - Personalizado con nombre del usuario
- **Verificación:** ✅ Sin errores TypeScript

---

### ⏳ TODO #10: Mostrar historial de asignaciones
- **Estado:** ⏳ PENDIENTE
- **Prioridad:** 🟡 MEDIO
- **Categoría:** Auditoría
- **Archivos a modificar:**
  - `src/presentation/components/AssignmentsDialog.tsx`
  - `src/hooks/useAuditLogs.ts` (CREAR)
- **Implementación sugerida:**
  ```typescript
  // Agregar tab "Historial" en AssignmentsDialog
  <Tabs defaultValue="areas">
    <TabsList>
      <TabsTrigger value="areas">Áreas</TabsTrigger>
      <TabsTrigger value="warehouses">Bodegas</TabsTrigger>
      <TabsTrigger value="history">Historial</TabsTrigger> {/* ← NUEVO */}
    </TabsList>

    <TabsContent value="history">
      <div className="space-y-2">
        {assignmentHistory.map(log => (
          <div key={log.id} className="flex justify-between border-b pb-2">
            <div>
              <p className="font-medium">{log.action}</p>
              <p className="text-xs text-muted-foreground">
                {log.entityType} • {log.entityName}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{log.performedBy}</p>
              <p>{format(log.performedAt, 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </div>
        ))}
      </div>
    </TabsContent>
  </Tabs>
  ```
- **Dependencias:**
  - ✅ auditLogRepo ya implementado
  - ⏳ Backend endpoint GET /audit-logs?entityType=USER&entityId=X
- **Estimado:** 45 minutos

---

### ⏳ TODO #12: Validar bodega pertenece al área del Jefe (Backend)
- **Estado:** ⏳ PENDIENTE
- **Prioridad:** 🟡 MEDIO
- **Categoría:** Seguridad/Backend
- **Archivo:** Backend - `controllers/assignmentController.js`
- **Implementación sugerida:**
  ```javascript
  async assignSupervisorToWarehouse(req, res) {
    const { warehouseId, supervisorId } = req.body;
    const managerId = req.user.id;
    
    // Obtener bodega
    const warehouse = await Warehouse.findById(warehouseId);
    
    // Verificar que el Jefe tenga asignada el área de la bodega
    const managerAreas = await Assignment.find({ 
      userId: managerId, 
      isActive: true 
    });
    
    const hasAccess = managerAreas.some(a => a.areaId === warehouse.areaId);
    
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'No puedes asignar supervisores a bodegas fuera de tus áreas' 
      });
    }
    
    // Continuar con asignación...
  }
  ```
- **Estimado:** 30 minutos (Backend)

---

### ⏳ TODO #13 & #14: Validar estado y capacidad de bodegas
- **Estado:** ⏳ PENDIENTE
- **Prioridad:** 🟡 MEDIO
- **Categoría:** Validación de Negocio
- **Archivos a modificar:**
  - `src/presentation/components/AssignWarehousesDialog.tsx` (líneas ~80)
- **Implementación sugerida:**
  ```typescript
  const availableWarehouses = useMemo(() => {
    return allWarehouses.filter(w => {
      // Excluir bodegas ya asignadas
      if (currentWarehouseIds.includes(w.id)) return false;
      
      // ✅ AGREGAR: Validar estado ACTIVO
      if (w.status !== 'ACTIVO') return false;
      
      // ✅ AGREGAR: Validar capacidad disponible
      const currentCapacity = w.currentCapacityKg || 0;
      if (currentCapacity >= w.capacityKg) return false;
      
      return true;
    });
  }, [allWarehouses, currentWarehouseIds]);
  ```
- **Estimado:** 20 minutos

---

### ⏳ TODO #18: Revocar asignaciones al deshabilitar Jefe
- **Estado:** ⏳ PENDIENTE
- **Prioridad:** 🟡 MEDIO
- **Categoría:** Lógica de Negocio
- **Archivos a modificar:**
  - Backend: `controllers/userController.js`
- **Implementación sugerida:**
  ```javascript
  async disableUser(req, res) {
    const { userId } = req.params;
    
    // Obtener usuario
    const user = await User.findById(userId);
    
    // Si es JEFE, revocar asignaciones de supervisores
    if (user.role === 'JEFE') {
      // Obtener áreas del jefe
      const managerAreas = await Assignment.find({
        userId: userId,
        entityType: 'AREA',
        isActive: true
      });
      
      const areaIds = managerAreas.map(a => a.entityId);
      
      // Obtener bodegas en esas áreas
      const warehouses = await Warehouse.find({ areaId: { $in: areaIds } });
      const warehouseIds = warehouses.map(w => w.id);
      
      // Desactivar asignaciones de supervisores en esas bodegas
      await Assignment.updateMany(
        { 
          entityId: { $in: warehouseIds },
          entityType: 'WAREHOUSE',
          isActive: true
        },
        { 
          isActive: false,
          revokedAt: new Date(),
          revokedBy: req.user.id,
          revokeReason: 'Manager disabled'
        }
      );
    }
    
    // Deshabilitar usuario
    user.status = 'DESHABILITADO';
    await user.save();
    
    res.json({ message: 'Usuario deshabilitado' });
  }
  ```
- **Estimado:** 45 minutos (Backend)

---

### ⏳ TODO #19 & #23: Mostrar historial en detalle de área
- **Estado:** ⏳ PENDIENTE
- **Prioridad:** 🟡 MEDIO
- **Categoría:** UX/Auditoría
- **Archivos a modificar:**
  - `src/presentation/views/AreaDetailView.tsx`
- **Implementación sugerida:**
  ```typescript
  // Agregar sección de historial
  <Card className="mt-4">
    <CardHeader>
      <CardTitle>Historial de Modificaciones</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {areaHistory.map(log => (
          <div key={log.id} className="flex justify-between border-b pb-2">
            <div>
              <p className="font-medium">{log.action}</p>
              <p className="text-xs text-muted-foreground">
                {log.details?.field}: {log.details?.oldValue} → {log.details?.newValue}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{log.performedByName}</p>
              <p>{format(log.performedAt, 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
  ```
- **Dependencias:**
  - Backend endpoint: GET /audit-logs?entityType=AREA&entityId=X
- **Estimado:** 30 minutos

---

## 🟢 TODOs BAJO (0/2 - 0%)

### ⏳ TODO #11: Modal de advertencia si es única bodega
- **Estado:** ⏳ PENDIENTE
- **Prioridad:** 🟢 BAJO
- **Categoría:** UX
- **Archivos a modificar:**
  - `src/presentation/views/AreaDetailView.tsx` (líneas ~140)
- **Implementación sugerida:**
  ```typescript
  const handleRemoveWarehouse = async (warehouseId: string) => {
    // ✅ AGREGAR: Validación antes de remover
    if (assignedWarehouses.length === 1) {
      const confirmed = await showConfirmDialog({
        title: "Remover única bodega",
        description: "Esta es la única bodega asignada al área. Si la remueves, el área quedará sin bodegas. ¿Deseas continuar?",
        variant: "warning"
      });
      
      if (!confirmed) return;
    }
    
    // Continuar con remoción...
  };
  ```
- **Estimado:** 15 minutos

---

### ⏳ TODO #14: Mejorar mensaje de modal de reasignación
- **Estado:** ⏳ PENDIENTE
- **Prioridad:** 🟢 BAJO
- **Categoría:** UX
- **Archivos a modificar:**
  - `src/presentation/components/AssignmentsDialog.tsx` (líneas ~250)
- **Implementación sugerida:**
  ```typescript
  const confirmMessage = useMemo(() => {
    const changes = [];
    if (newAreas.length !== currentAreas.length) {
      changes.push(`${newAreas.length} áreas`);
    }
    if (newWarehouses.length !== currentWarehouses.length) {
      changes.push(`${newWarehouses.length} bodegas`);
    }
    
    if (changes.length === 0) return "No hay cambios para aplicar";
    
    return `Se asignarán ${changes.join(' y ')} a ${user.name} ${user.lastName}`;
  }, [newAreas, newWarehouses, currentAreas, currentWarehouses]);
  ```
- **Estimado:** 15 minutos

---

## 📋 Próximos Pasos

### Inmediato (Siguientes 2 horas)
1. ✅ ~~Implementar TODO #2, #3, #4 (UX mejoras en UsersView)~~ COMPLETADO
2. ✅ ~~Implementar TODO #7 (Mensajes modal confirmación)~~ COMPLETADO
3. ⏳ **[SIGUIENTE]** Implementar TODO #10 (Historial asignaciones)
4. ⏳ Implementar TODO #13 & #14 (Validación bodegas)

### Corto Plazo (Backend - 1-2 días)
1. ⏳ Crear tabla `audit_logs` en base de datos
2. ⏳ Implementar endpoint POST `/audit-logs`
3. ⏳ Implementar endpoint GET `/audit-logs?entityType=X&entityId=Y`
4. ⏳ Implementar TODO #12 (Validación backend área-bodega)
5. ⏳ Implementar TODO #18 (Revocar asignaciones al deshabilitar Jefe)

### Mediano Plazo (Opcional - 3-5 días)
1. ⏳ TODO #11 (Modal advertencia única bodega)
2. ⏳ TODO #14 (Mensaje reasignación específico)
3. ⏳ TODO #19 & #23 (Historial en detalle de área)

---

## 🎯 Métricas de Calidad

### Cobertura de Código
- ✅ Sin errores TypeScript en archivos modificados
- ✅ Clean Architecture respetada (Domain → Application → Infrastructure → Presentation)
- ✅ Dependency Injection aplicada (Repository Pattern)

### Testing
- ⏳ Unit tests pendientes para:
  - `ToggleUserStatus` use case (con auditLogRepo)
  - `ApiAuditLogRepository` (mocking API calls)
  - Filtros de búsqueda en `UsersView`

### Documentación
- ✅ Tipos TypeScript completos (AuditLog, AuditAction, etc.)
- ✅ Comentarios en código crítico
- ✅ README actualizado con nuevas dependencias

---

## 📝 Notas Importantes

### Backend Pendiente
⚠️ **CRÍTICO**: El sistema de auditoría está implementado en frontend pero requiere backend funcional:
- Crear tabla `audit_logs` (SQL schema incluida en TODO #6)
- Implementar endpoints POST/GET `/audit-logs`
- Configurar índices para queries eficientes

### Validaciones Dobles (Frontend + Backend)
✅ **SEGURIDAD**: Todas las validaciones críticas deben estar en ambos lados:
- Frontend: UX inmediata, prevención temprana
- Backend: Seguridad final, no confiar en cliente

### Testing Manual
Antes de marcar como "COMPLETADO FINAL":
1. Probar flujo completo de habilitar/deshabilitar usuario
2. Verificar que no se puede asignar bodegas a áreas con hijos
3. Verificar búsqueda por RUT con diferentes formatos
4. Verificar estilos visuales de usuarios deshabilitados
5. Probar permisos (ADMIN/JEFE/SUPERVISOR)

---

**Última actualización:** 2025-01-XX XX:XX
**Responsable:** GitHub Copilot (Claude Sonnet 4.5)
