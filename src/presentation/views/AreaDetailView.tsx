"use client";

import { useState, useMemo } from "react";
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
  Edit,
  Eye,
  Trash2,
  UserPlus,
  Star,
  GitBranch,
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
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/presentation/components/EmptyState";
import { ConfirmDialog } from "@/presentation/components/ConfirmDialog";
import { useAreas, useUpdateArea } from "@/hooks/useAreas";
import { useAreaDetail } from "@/hooks/useAreaDetail";
import { useRemoveManager } from "@/hooks/useAssignments";
import { RemoveWarehouseFromArea } from "@/application/usecases/assignment/RemoveWarehouseToArea";

interface AreaDetailViewProps {
  areaId: string;
}

export function AreaDetailView({ areaId }: AreaDetailViewProps) {
  const router = useRouter();
  const { assignmentRepo } = useRepositories();
  const { toast } = useToast();

  // React Query hooks - caché compartido
  const { data: allAreas = [] } = useAreas();
  const updateAreaMutation = useUpdateArea();
  const removeManagerMutation = useRemoveManager();
  // Hook nuevo: trae todo el detalle del área ya mapeado
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useAreaDetail(areaId);

  const area: Area | null = data?.area ?? null;
  const assignedManagers: User[] = data?.managers ?? [];
  const assignedWarehouses: WarehouseEntity[] = data?.warehouses ?? [];

  const [warehousesDialogOpen, setWarehousesDialogOpen] = useState(false);
  const [managersDialogOpen, setManagersDialogOpen] = useState(false);
  const [assignJefeDialogOpen, setAssignJefeDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [removingJefeId, setRemovingJefeId] = useState<string | null>(null);
  const [removingWarehouseId, setRemovingWarehouseId] = useState<string | null>(null);

  const [confirmRemoveJefeOpen, setConfirmRemoveJefeOpen] = useState(false);
  const [confirmRemoveWarehouseOpen, setConfirmRemoveWarehouseOpen] = useState(false);
  const [singleWarehouseWarningOpen, setSingleWarehouseWarningOpen] = useState(false);

  const [selectedJefeToRemove, setSelectedJefeToRemove] = useState<{ manager: User; name: string } | null>(null);
  const [selectedWarehouseToRemove, setSelectedWarehouseToRemove] = useState<WarehouseEntity | null>(null);

  // Calcular parent y children usando caché de React Query
  const parentArea = useMemo(() => {
    if (!area?.parentId) return null;
    return allAreas.find((a) => a.id === area.parentId) ?? null;
  }, [area, allAreas]);

  const childAreas = useMemo(() => {
    return allAreas.filter(
      (a) => a.parentId === areaId || (a as any).parentAreaId === areaId
    );
  }, [allAreas, areaId]);

  // Validar si el área es nodo hoja (sin sub-áreas)
  const isLeafNode = useMemo(() => {
    return childAreas.length === 0;
  }, [childAreas]);

  const handleOpenWarehousesDialog = () => {
    if (!isLeafNode) {
      toast({
        title: "❌ Operación no permitida",
        description: "Solo puedes asignar bodegas a áreas sin sub-áreas (nodos hoja). Esta área tiene sub-áreas dependientes.",
        variant: "destructive",
      });
      return;
    }
    setWarehousesDialogOpen(true);
  };

  const openRemoveJefeConfirm = (manager: User, jefeName: string) => {
    setSelectedJefeToRemove({ manager, name: jefeName });
    setConfirmRemoveJefeOpen(true);
  };

  const handleRemoveJefe = async () => {
    if (!area || !selectedJefeToRemove) return;

    const { manager, name: jefeName } = selectedJefeToRemove;
    setRemovingJefeId(manager.id);

    try {
        await removeManagerMutation.mutateAsync({
          areaId: area.id,
          managerId: manager.id,
        });

      toast({
        title: "✅ Jefe removido",
        description: `${jefeName} ha sido removido del área ${area.name}`,
      });

      await refetch();
      setConfirmRemoveJefeOpen(false);
      setSelectedJefeToRemove(null);
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

  const openRemoveWarehouseConfirm = (warehouse: WarehouseEntity) => {
    setSelectedWarehouseToRemove(warehouse);
    setConfirmRemoveWarehouseOpen(true);
  };

  const handleRemoveWarehouse = async () => {
    if (!area || !selectedWarehouseToRemove) return;

    setRemovingWarehouseId(selectedWarehouseToRemove.id);
    try {
      const useCase = new RemoveWarehouseFromArea(assignmentRepo);
      const result = await useCase.execute(area.id, selectedWarehouseToRemove.id);

      if (!result.ok) {
        throw new Error(result.error || "No se pudo remover la bodega del área");
      }

      toast({
        title: "✅ Bodega removida",
        description: `${selectedWarehouseToRemove.name} ha sido removida del área ${area.name}`,
      });

      await refetch();
      setConfirmRemoveWarehouseOpen(false);
      setSelectedWarehouseToRemove(null);
    } catch (error: any) {
      console.error("Error al remover bodega:", error);
      toast({
        title: "❌ Error al remover",
        description: error.message || "No se pudo remover la bodega del área",
        variant: "destructive",
      });
    } finally {
      setRemovingWarehouseId(null);
    }
  };

  const handleEditArea = async (dataForm: { name: string; isActive: boolean }) => {
    if (!area) return;

    setEditLoading(true);
    try {
      const updates: Partial<Area> = {
        name: dataForm.name,
        status: dataForm.isActive ? "ACTIVO" : "INACTIVO",
      };

      await updateAreaMutation.mutateAsync({ id: area.id, data: updates });

      toast({
        title: "✅ Área actualizada",
        description: `El área "${dataForm.name}" se actualizó correctamente.`,
      });
      setEditDialogOpen(false);
      await refetch();
    } catch (error: any) {
      toast({
        title: "❌ Error al actualizar área",
        description: error?.message || "Ocurrió un error inesperado",
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
    refetch();
  };

  const handleManagersSuccess = () => {
    toast({
      title: "✅ Jefes actualizados",
      description: "Las asignaciones de jefes se guardaron correctamente",
    });
    refetch();
  };

  // Loading / error state usando el hook
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Cargando detalles del área...
          </p>
        </div>
      </div>
    );
  }

  if (error || !area) {
    return <EmptyState message="Área no encontrada" />;
  }

  const isPrincipal = area.level === 0 || area.nodeType === "ROOT";

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
              <div
                className="mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium
                  border bg-muted/60 text-muted-foreground"
              >
                {isPrincipal ? (
                  <>
                    <Star className="h-3 w-3" />
                    <span>Principal</span>
                  </>
                ) : (
                  <>
                    <GitBranch className="h-3 w-3" />
                    <span>Dependiente</span>
                  </>
                )}
              </div>
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
                onClick={handleOpenWarehousesDialog}
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
                  {assignedWarehouses.map((warehouse) => (
                    <div
                      key={warehouse.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium">{warehouse.name}</h3>
                            <EntityBadge status={warehouse.status} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Capacidad: {warehouse.capacityKg} kg
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openRemoveWarehouseConfirm(warehouse)}
                          disabled={removingWarehouseId === warehouse.id}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                          title="Quitar bodega del área"
                        >
                          {removingWarehouseId === warehouse.id ? (
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
                  {assignedManagers.map((manager) => (
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
                          <p className="text-sm text-muted-foreground truncate">
                            {manager.email}
                          </p>
                          {manager.phone && (
                            <p className="text-xs text-muted-foreground mt-1">
                              📞 {manager.phone}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            openRemoveJefeConfirm(
                              manager,
                              `${manager.name} ${manager.lastName}`,
                            )
                          }
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
                  {childAreas.map((childArea) => (
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
        currentWarehouseIds={assignedWarehouses.map((w) => w.id)}
        onSuccess={handleWarehousesSuccess}
      />

      <AssignManagersDialog
        open={managersDialogOpen}
        onOpenChange={setManagersDialogOpen}
        areaId={area.id}
        areaName={area.name}
        currentManagerIds={assignedManagers.map((m) => m.id)}
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
          onSuccess={refetch}
        />
      )}

      {/* Dialog de confirmación para eliminar jefe */}
      <ConfirmDialog
        open={confirmRemoveJefeOpen}
        onOpenChange={setConfirmRemoveJefeOpen}
        onConfirm={handleRemoveJefe}
        title="¿Quitar jefe del área?"
        description={
          selectedJefeToRemove
            ? `¿Está seguro de remover a ${selectedJefeToRemove.name} del área ${area.name}? Esta acción no se puede deshacer.`
            : ""
        }
      />

      {/* Dialog de confirmación para eliminar bodega */}
      <ConfirmDialog
        open={confirmRemoveWarehouseOpen}
        onOpenChange={setConfirmRemoveWarehouseOpen}
        onConfirm={handleRemoveWarehouse}
        title="¿Quitar bodega del área?"
        description={
          selectedWarehouseToRemove
            ? `¿Está seguro de remover la bodega "${selectedWarehouseToRemove.name}" del área ${area.name}? Esta acción no se puede deshacer.`
            : ""
        }
      />

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
