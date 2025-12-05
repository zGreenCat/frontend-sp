"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit,
  Warehouse,
  UserCog,
  Building2,
  Loader2,
  Calendar,
} from "lucide-react";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { Area } from "@/domain/entities/Area";
import { Warehouse as WarehouseEntity } from "@/domain/entities/Warehouse";
import { User } from "@/domain/entities/User";
import { TENANT_ID } from "@/shared/constants";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { AssignWarehousesDialog } from "@/presentation/components/AssignWarehousesDialog";
import { AssignManagersDialog } from "@/presentation/components/AssignManagersDialog";
import { AreaDialog } from "@/presentation/components/AreaDialog";
import { UpdateArea } from "@/application/usecases/area/UpdateArea";
import { GetAreaDetail } from "@/application/usecases/area/GetAreaDetail";
import { CreateAreaInput } from "@/shared/schemas";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/presentation/components/EmptyState";

interface AreaDetailViewProps {
  areaId: string;
}

export function AreaDetailView({ areaId }: AreaDetailViewProps) {
  const router = useRouter();
  const { areaRepo, warehouseRepo, userRepo } = useRepositories();
  const { toast } = useToast();

  const [area, setArea] = useState<Area | null>(null);
  const [parentArea, setParentArea] = useState<Area | null>(null);
  const [assignedWarehouses, setAssignedWarehouses] = useState<WarehouseEntity[]>([]);
  const [assignedManagers, setAssignedManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [warehousesDialogOpen, setWarehousesDialogOpen] = useState(false);
  const [managersDialogOpen, setManagersDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

      console.log('👥 Managers from API:', managers);
      console.log('🏢 Warehouses from API:', warehouses);

      // Convertir managers del API a entidades User
      const managersAsUsers: User[] = managers.map((m: any) => {
        // El API envía { id, name, email } donde name es el nombre completo
        let firstName = '';
        let lastName = '';
        console.log('Processing manager:', m);
        
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
        };
      });
      setAssignedManagers(managersAsUsers);

      // Convertir warehouses del API a entidades Warehouse
      const warehousesAsEntities: WarehouseEntity[] = warehouses.map((w: any) => ({
        id: w.id,
        name: w.name || 'Sin nombre',
        capacityKg: w.capacityKg || w.capacity || 0,
        status: 'ACTIVO' as const,
        areaId: areaId,
        tenantId: TENANT_ID,
      }));
      setAssignedWarehouses(warehousesAsEntities);

      // Cargar área padre si existe
      if (areaData.parentId) {
        const parent = await areaRepo.findById(areaData.parentId, TENANT_ID);
        setParentArea(parent);
      }
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

  const loadWarehouses = async (areaId: string) => {
    try {
      const warehouseIds = await (areaRepo as any).getAssignedWarehouses(areaId);
      const allWarehouses = await warehouseRepo.findAll(TENANT_ID);
      const filtered = allWarehouses.filter(w => warehouseIds.includes(w.id));
      setAssignedWarehouses(filtered);
    } catch (error) {
      console.error("Error al cargar bodegas:", error);
    }
  };

  const loadManagers = async (areaId: string) => {
    try {
      const managerIds = await (areaRepo as any).getAssignedManagers(areaId);
      const allUsers = await userRepo.findAll(TENANT_ID);
      const filtered = allUsers.data.filter((u: User) => managerIds.includes(u.id));
      setAssignedManagers(filtered);
    } catch (error) {
      console.error("Error al cargar jefes:", error);
    }
  };

  const handleEditArea = async (data: CreateAreaInput) => {
    if (!area) return;

    setActionLoading(true);
    try {
      const useCase = new UpdateArea(areaRepo);
      // Convertir CreateAreaInput a Partial<Area> con el tipo correcto
      const updates: Partial<Area> = {
        name: data.name,
        level: data.level,
        parentId: data.parentId,
        status: data.status as 'ACTIVO' | 'INACTIVO',
        tenantId: data.tenantId,
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
      setActionLoading(false);
    }
  };

  const handleWarehousesSuccess = async () => {
    toast({
      title: "✅ Bodegas actualizadas",
      description: "Las asignaciones de bodegas se guardaron correctamente",
    });
    await loadWarehouses(areaId);
  };

  const handleManagersSuccess = async () => {
    toast({
      title: "✅ Jefes actualizados",
      description: "Las asignaciones de jefes se guardaron correctamente",
    });
    await loadManagers(areaId);
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
          </div>
          <p className="text-muted-foreground">
            Nivel {area.level}
            {parentArea && ` • Área Dependiente de ${parentArea.name}`}
          </p>
        </div>
        <Button onClick={() => setEditDialogOpen(true)} className="gap-2">
          <Edit className="h-4 w-4" />
          Editar Área
        </Button>
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
              <p className="font-medium">Nivel {area.level}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Área</p>
              <p className="font-medium">
                {area.level === 1 ? "📍 Principal" : "📎 Dependiente"}
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
                onClick={() => setManagersDialogOpen(true)}
                size="sm"
                className="gap-2"
              >
                <UserCog className="h-4 w-4" />
                Gestionar Jefes
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
                      className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">
                          {manager.name} {manager.lastName}
                        </h3>
                        <EntityBadge status={manager.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">{manager.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {manager.phone || "Sin teléfono"}
                      </p>
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

      <AreaDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditArea}
        defaultValues={area}
        isLoading={actionLoading}
        mode="edit"
      />
    </div>
  );
}
