"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Warehouse,
  UserCog,
  Building2,
  Loader2,
  Calendar,
  Edit,
  Eye,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { Area } from "@/domain/entities/Area";
import { Warehouse as WarehouseEntity } from "@/domain/entities/Warehouse";
import { User } from "@/domain/entities/User";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { AssignWarehousesDialog } from "@/presentation/components/AssignWarehousesDialog";
import { AssignManagersDialog } from "@/presentation/components/AssignManagersDialog";
import { AssignAreaJefesDialog } from "@/presentation/components/AssignAreaJefesDialog";
import { EditAreaStatusDialog } from "@/presentation/components/EditAreaStatusDialog";
import { GetAreaDetail } from "@/application/usecases/area/GetAreaDetail";
import { UpdateArea } from "@/application/usecases/area/UpdateArea";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/presentation/components/EmptyState";
import { apiClient } from "@/infrastructure/api/apiClient";
import { useAreas, useAssignManager, useRemoveManager } from "@/hooks/useAreas";
import { useWarehousesByArea } from "@/hooks/useWarehouses";

interface AreaDetailViewProps {
  areaId: string;
}

export function AreaDetailView({ areaId }: AreaDetailViewProps) {
  const router = useRouter();
  const { areaRepo, userRepo } = useRepositories();
  const { toast } = useToast();

  // React Query hooks - caché compartido
  const { data: allAreas = [] } = useAreas();
  const { data: areaWarehouses = [] } = useWarehousesByArea(areaId);
  const assignManagerMutation = useAssignManager();
  const removeManagerMutation = useRemoveManager();

  const [area, setArea] = useState<Area | null>(null);
  const [assignedManagers, setAssignedManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [warehousesDialogOpen, setWarehousesDialogOpen] = useState(false);
  const [managersDialogOpen, setManagersDialogOpen] = useState(false);
  const [assignJefeDialogOpen, setAssignJefeDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Calcular parent y children usando caché de React Query
  const parentArea = useMemo(() => {
    if (!area?.parentId) return null;
    return allAreas.find(a => a.id === area.parentId) ?? null;
  }, [area, allAreas]);

  const childAreas = useMemo(() => {
    return allAreas.filter(a => 
      a.parentId === areaId || (a as any).parentAreaId === areaId
    );
  }, [allAreas, areaId]);

  // Transformar warehouses de React Query al formato esperado
  const assignedWarehouses = useMemo<WarehouseEntity[]>(() => {
    return areaWarehouses.map(w => ({
      ...w,
      capacityKg: w.capacityKg || 0,
      status: (w.status || 'ACTIVO') as 'ACTIVO' | 'INACTIVO',
    }));
  }, [areaWarehouses]);

  useEffect(() => {
    loadAreaDetails();
  }, [areaId]);

  const loadAreaDetails = async () => {
    setLoading(true);
    try {
      // Usar el nuevo caso de uso para obtener información completa
      const getDetailUseCase = new GetAreaDetail(areaRepo);
      const result = await getDetailUseCase.execute(areaId);

      if (!result.ok || !result.value) {
        toast({
          title: "❌ Área no encontrada",
          description: result.error || "El área solicitada no existe",
          variant: "destructive",
        });
        router.push("/areas");
        return;
      }

      const { area: areaData, managers, warehouses } = result.value;
      setArea(areaData);

      // Convertir managers del API a entidades User
      // Filtrar solo usuarios con rol JEFE (excluir supervisores si el backend los envía)
      const managersAsUsers: User[] = managers
        .filter((m: any) => {
          // Si el backend envía rol, verificar que sea JEFE/JEFE_AREA
          if (m.role) {
            const roleName = typeof m.role === 'string' ? m.role : m.role.name;
            return roleName === 'JEFE' || roleName === 'JEFE_AREA' || roleName === 'AREA_MANAGER';
          }
          // Si no envía rol, asumir que todos los managers son jefes
          return true;
        })
        .map((m: any) => {
          // El API envía { id, name, email } donde name es el nombre completo
          let firstName = '';
          let lastName = '';
          
          // El API envía 'name' como nombre completo
          if (m.name) {
            const nameParts = m.name.trim().split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }
          // Fallback por si viene fullName
          else if (m.fullName) {
            const nameParts = m.fullName.trim().split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }
          // Fallback por si vienen separados
          else if (m.firstName || m.lastName) {
            firstName = m.firstName || '';
            lastName = m.lastName || '';
          }

          return {
            id: m.id,
            name: firstName,
            lastName: lastName,
            email: m.email || '',
            rut: '',
            phone: '',
            role: 'JEFE' as const,
            status: 'HABILITADO' as const,
            areas: [areaId],
            warehouses: [],
            tenantId: TENANT_ID,
            areaAssignments: m.assignmentId ? [{
              id: m.assignmentId,
              userId: m.id,
              areaId: areaId,
              assignedBy: '',
              assignedAt: '',
              revokedAt: null,
              isActive: true,
              area: { id: areaId, name: area?.name || '', nodeType: 'ROOT', level: 0, isActive: true }
            }] : [],
          };
        });
      setAssignedManagers(managersAsUsers);
      
      // ✅ warehouses, parent y children ya vienen de React Query (useMemo)
    } catch (error) {
      console.error("Error al cargar detalles del área:", error);
      toast({
        title: "❌ Error",
        description: "No se pudo cargar la información del área",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  const handleRemoveJefe = async (manager: User, jefeName: string) => {
    if (!area) return;

    setRemovingJefeId(manager.id);
    try {
      // Buscar el assignmentId en areaAssignments del manager
      const assignment = manager.areaAssignments?.find(
        (a) => a.areaId === area.id && a.isActive === true
      );

      if (!assignment || !assignment.id) {
        throw new Error('No se encontró la asignación activa para este jefe en esta área');
      }

      // Usar el endpoint correcto: DELETE /assignments/{assignmentId}
      await apiClient.delete(`/assignments/${assignment.id}`, true);
      
      toast({
        title: "✅ Jefe removido",
        description: `${jefeName} ha sido removido del área ${area.name}`,
      });
      
      // Recargar detalles para actualizar la lista
      await loadAreaDetails();
    } catch (error: any) {
      console.error("Error al remover jefe:", error);
      toast({
        title: "❌ Error al remover",
        description: error.message || "No se pudo remover el jefe del área",
        variant: "destructive",
      });
    } finally {
      setRemovingJefeId(null);
    }
  };

  const handleEditArea = async (data: { name: string; isActive: boolean }) => {
    if (!area) return;

    setEditLoading(true);
    try {
      const useCase = new UpdateArea(areaRepo);
      const updates: Partial<Area> = {
        name: data.name,
        status: data.isActive ? "ACTIVO" : "INACTIVO",
      };

      const result = await useCase.execute(area.id, updates, TENANT_ID);

      if (result.ok) {
        toast({
          title: "✅ Área actualizada",
          description: `El área "${data.name}" se actualizó correctamente.`,
        });
        setEditDialogOpen(false);
        await loadAreaDetails();
      } else {
        toast({
          title: "❌ Error al actualizar área",
          description: result.error || "Ocurrió un error inesperado",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo actualizar el área",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleWarehousesSuccess = () => {
    toast({
      title: "✅ Bodegas actualizadas",
      description: "Las asignaciones de bodegas se guardaron correctamente",
    });
    // ✅ React Query invalida automáticamente la caché
  };

  const handleManagersSuccess = () => {
    toast({
      title: "✅ Jefes actualizados",
      description: "Las asignaciones de jefes se guardaron correctamente",
    });
    // Recargar detalles para actualizar managers
    loadAreaDetails();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Cargando detalles del área...</p>
        </div>
      </div>
    );
  }

  if (!area) {
    return <EmptyState message="Área no encontrada" />;
  }

  return (
    <div className="space-y-6">
      {/* Header con breadcrumbs y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/areas")}
            className="gap-2 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Áreas
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{area.name}</h1>
            <EntityBadge status={area.status} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </div>
          <p className="text-muted-foreground">
            Nivel {area.level + 1}
            {parentArea && ` • Área Dependiente de ${parentArea.name}`}
          </p>
        </div>
      </div>

      {/* Card de información general */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre del Área</p>
              <p className="font-medium">{area.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nivel Jerárquico</p>
              <p className="font-medium">Nivel {area.level + 1}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Área</p>
              <p className="font-medium">
                {area.level === 0 ? "📍 Principal" : "📎 Dependiente"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <div className="mt-1">
                <EntityBadge status={area.status} />
              </div>
            </div>
            {parentArea && (
              <div>
                <p className="text-sm text-muted-foreground">Área Padre</p>
                <p className="font-medium">{parentArea.name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">ID del Área</p>
              <p className="font-mono text-xs">{area.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para asignaciones */}
      <Tabs defaultValue="warehouses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="warehouses" className="gap-2">
            <Warehouse className="h-4 w-4" />
            Bodegas ({assignedWarehouses.length})
          </TabsTrigger>
          <TabsTrigger value="managers" className="gap-2">
            <UserCog className="h-4 w-4" />
            Jefes ({assignedManagers.length})
          </TabsTrigger>
          <TabsTrigger value="subareas" className="gap-2">
            <Building2 className="h-4 w-4" />
            Sub-áreas ({childAreas.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab de Bodegas */}
        <TabsContent value="warehouses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bodegas Asignadas</CardTitle>
              <Button
                onClick={() => setWarehousesDialogOpen(true)}
                size="sm"
                className="gap-2"
              >
                <Warehouse className="h-4 w-4" />
                Gestionar Bodegas
              </Button>
            </CardHeader>
            <CardContent>
              {assignedWarehouses.length === 0 ? (
                <EmptyState message="No hay bodegas asignadas a esta área" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignedWarehouses.map(warehouse => (
                    <div
                      key={warehouse.id}
                      className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{warehouse.name}</h3>
                        <EntityBadge status={warehouse.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Capacidad: {warehouse.capacityKg} kg
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Jefes */}
        <TabsContent value="managers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Jefes de Área</CardTitle>
              <Button
                onClick={() => setAssignJefeDialogOpen(true)}
                size="sm"
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Asignar Jefe
              </Button>
            </CardHeader>
            <CardContent>
              {assignedManagers.length === 0 ? (
                <EmptyState message="No hay jefes asignados a esta área" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedManagers.map(manager => (
                    <div
                      key={manager.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium">
                              {manager.name} {manager.lastName}
                            </h3>
                            <EntityBadge status={manager.status} />
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{manager.email}</p>
                          {manager.phone && (
                            <p className="text-xs text-muted-foreground mt-1">
                              📞 {manager.phone}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveJefe(manager, `${manager.name} ${manager.lastName}`)}
                          disabled={removingJefeId === manager.id}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                          title="Quitar jefe de área"
                        >
                          {removingJefeId === manager.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Sub-áreas */}
        <TabsContent value="subareas">
          <Card>
            <CardHeader>
              <CardTitle>Sub-áreas</CardTitle>
            </CardHeader>
            <CardContent>
              {childAreas.length === 0 ? (
                <EmptyState message="No hay sub-áreas asociadas a esta área" />
              ) : (
                <div className="space-y-3">
                  {childAreas.map(childArea => (
                    <div
                      key={childArea.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-medium">{childArea.name}</h3>
                          <EntityBadge status={childArea.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Nivel {(childArea.level ?? 0) + 1}
                          {childArea.nodeType && ` • ${childArea.nodeType}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/areas/${childArea.id}`)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Detalle
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AssignWarehousesDialog
        open={warehousesDialogOpen}
        onOpenChange={setWarehousesDialogOpen}
        areaId={area.id}
        areaName={area.name}
        currentWarehouseIds={assignedWarehouses.map(w => w.id)}
        onSuccess={handleWarehousesSuccess}
      />

      <AssignManagersDialog
        open={managersDialogOpen}
        onOpenChange={setManagersDialogOpen}
        areaId={area.id}
        areaName={area.name}
        currentManagerIds={assignedManagers.map(m => m.id)}
        onSuccess={handleManagersSuccess}
      />

      {/* Dialog nuevo para asignar jefes de área */}
      {area && (
        <AssignAreaJefesDialog
          open={assignJefeDialogOpen}
          onOpenChange={setAssignJefeDialogOpen}
          areaId={area.id}
          areaName={area.name}
          currentJefes={assignedManagers}
          onSuccess={loadAreaDetails}
        />
      )}

      {/* Dialog de edición de nombre y estado */}
      {area && (
        <EditAreaStatusDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          area={{
            id: area.id,
            name: area.name,
            status: area.status,
          }}
          onSubmit={handleEditArea}
          isLoading={editLoading}
        />
      )}
    </div>
  );
}
