"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit } from "lucide-react";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";
import { WarehouseDialog } from "@/presentation/components/WarehouseDialog";
import {
  useWarehouses,
  useCreateWarehouse,
  useUpdateWarehouse,
} from "@/hooks/useWarehouses";
import {
  useAssignWarehouseToArea,
  useAssignSupervisorToWarehouse,
} from "@/hooks/useAssignments";
import { useAreas } from "@/hooks/useAreas";
import { useUsers } from "@/hooks/useUsers";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { CreateWarehouseInput } from "@/shared/schemas";
import { Warehouse } from "@/domain/entities/Warehouse";

export function WarehousesView() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // React Query hooks
  const { data: warehouses = [], isLoading: loading } = useWarehouses();
  const createWarehouseMutation = useCreateWarehouse();
  const updateWarehouseMutation = useUpdateWarehouse();
  const assignWarehouseToAreaMutation = useAssignWarehouseToArea();
  const assignSupervisorToWarehouseMutation = useAssignSupervisorToWarehouse();
  
  // Data for assignments
  const { data: areas = [] } = useAreas();
  const usersQuery = useUsers();
  const usersData = usersQuery.data;
  const users = Array.isArray(usersData) ? usersData : (usersData?.data || []);

  // Permisos y toasts
  const { can } = usePermissions();
  const { toast } = useToast();

  const canCreate = can("warehouses:create");
  const canEdit = can("warehouses:edit");

  const filteredWarehouses = warehouses.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (
    data: CreateWarehouseInput,
    assignments?: { areaId?: string; supervisorId?: string }
  ) => {
    try {
      const createdWarehouse = await createWarehouseMutation.mutateAsync(data);

      // Track assignment results
      const assignmentResults: {
        area: boolean;
        supervisor: boolean;
        areaName?: string;
        supervisorName?: string;
      } = {
        area: false,
        supervisor: false,
      };

      // Attempt area assignment if provided
      if (assignments?.areaId) {
        try {
          await assignWarehouseToAreaMutation.mutateAsync({
            areaId: assignments.areaId,
            warehouseId: createdWarehouse.id,
          });
          assignmentResults.area = true;
          const area = areas.find((a) => a.id === assignments.areaId);
          assignmentResults.areaName = area?.name;
        } catch (error) {
          console.error("Error al asignar bodega al área:", error);
        }
      }

      // Attempt supervisor assignment if provided
      if (assignments?.supervisorId) {
        try {
          await assignSupervisorToWarehouseMutation.mutateAsync({
            warehouseId: createdWarehouse.id,
            supervisorId: assignments.supervisorId,
          });
          assignmentResults.supervisor = true;
          const supervisor = users.find((u) => u.id === assignments.supervisorId);
          assignmentResults.supervisorName = supervisor ? `${supervisor.name} ${supervisor.lastName}` : undefined;
        } catch (error) {
          console.error("Error al asignar supervisor a la bodega:", error);
        }
      }

      // Build toast message based on results
      const hasAssignments =
        assignments?.areaId || assignments?.supervisorId;
      const allAssignmentsSucceeded =
        (!assignments?.areaId || assignmentResults.area) &&
        (!assignments?.supervisorId || assignmentResults.supervisor);

      if (!hasAssignments) {
        // No assignments attempted
        toast({
          title: "✅ Bodega creada",
          description: `La bodega "${createdWarehouse.name}" ha sido creada exitosamente con capacidad de ${createdWarehouse.maxCapacityKg} Kg.`,
        });
      } else if (allAssignmentsSucceeded) {
        // All assignments succeeded
        const assignmentParts: string[] = [];
        if (assignmentResults.area && assignmentResults.areaName) {
          assignmentParts.push(`asignada al área "${assignmentResults.areaName}"`);
        }
        if (assignmentResults.supervisor && assignmentResults.supervisorName) {
          assignmentParts.push(
            `con supervisor "${assignmentResults.supervisorName}"`
          );
        }

        toast({
          title: "✅ Bodega creada y asignada",
          description: `La bodega "${createdWarehouse.name}" ha sido creada exitosamente ${assignmentParts.join(" y ")}.`,
        });
      } else {
        // Partial failure: warehouse created but some assignments failed
        const failedAssignments: string[] = [];
        if (assignments?.areaId && !assignmentResults.area) {
          failedAssignments.push("área");
        }
        if (assignments?.supervisorId && !assignmentResults.supervisor) {
          failedAssignments.push("supervisor");
        }

        toast({
          title: "⚠️ Bodega creada con advertencias",
          description: `La bodega "${createdWarehouse.name}" se creó correctamente, pero no se pudieron registrar las asignaciones de: ${failedAssignments.join(", ")}. Puedes asignarlas manualmente desde los módulos correspondientes.`,
          variant: "default",
        });
      }

      setDialogOpen(false);
      setSelectedWarehouse(null);
    } catch (error: any) {
      console.error("Error al crear bodega:", error);
      toast({
        title: "❌ Error al crear bodega",
        description:
          error?.message ||
          "No se pudo crear la bodega. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (data: CreateWarehouseInput) => {
    if (!selectedWarehouse) return;

    try {
      const updatedWarehouse = await updateWarehouseMutation.mutateAsync({
        id: selectedWarehouse.id,
        data: {
          name: data.name,
          maxCapacityKg: data.maxCapacityKg,
          isEnabled: data.isEnabled,
        },
      });

      toast({
        title: "✅ Bodega actualizada",
        description: `La bodega "${updatedWarehouse.name}" ha sido actualizada correctamente.`,
      });

      setDialogOpen(false);
      setSelectedWarehouse(null);
    } catch (error: any) {
      console.error("Error al actualizar bodega:", error);
      toast({
        title: "❌ Error al actualizar bodega",
        description: error?.message || "No se pudo actualizar la bodega. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (
    data: CreateWarehouseInput,
    assignments?: { areaId?: string; supervisorId?: string }
  ) => {
    if (selectedWarehouse) {
      await handleEdit(data);
    } else {
      await handleCreate(data, assignments);
    }
  };

  const openCreateDialog = () => {
    setSelectedWarehouse(null);
    setDialogOpen(true);
  };

  const openEditDialog = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Bodegas</h1>
          <p className="text-muted-foreground">Gestión de almacenes y capacidades</p>
        </div>
        {canCreate && (
          <Button
            onClick={openCreateDialog}
            className="bg-primary text-primary-foreground h-10 gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Bodega
          </Button>
        )}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar bodega..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-secondary/30"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : filteredWarehouses.length === 0 ? (
            <EmptyState message="No se encontraron bodegas" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Nombre
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Capacidad (Kg)
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Estado
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Área
                    </th>
                    {canEdit && (
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredWarehouses.map((warehouse) => (
                    <tr
                      key={warehouse.id}
                      className="border-b border-border hover:bg-secondary/20 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium text-foreground">
                        <button
                          onClick={() => router.push(`/warehouses/${warehouse.id}`)}
                          className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {warehouse.name}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-foreground">
                        {warehouse.maxCapacityKg?.toLocaleString() || warehouse.capacityKg?.toLocaleString() || 0}
                      </td>
                      <td className="py-4 px-4">
                        <EntityBadge
                          status={
                            typeof warehouse.status === "string"
                              ? warehouse.status
                              : warehouse.isEnabled
                              ? "ACTIVO"
                              : "INACTIVO"
                          }
                        />
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {warehouse.areaName || "Sin asignar"}
                      </td>
                      {canEdit && (
                        <td className="py-4 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(warehouse)}
                            className="h-8 gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear/editar bodega */}
      <WarehouseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={
          selectedWarehouse
            ? {
                name: selectedWarehouse.name,
                maxCapacityKg: selectedWarehouse.maxCapacityKg || selectedWarehouse.capacityKg || 900,
                isEnabled: selectedWarehouse.isEnabled ?? (selectedWarehouse.status === "ACTIVO"),
              }
            : undefined
        }
        isLoading={createWarehouseMutation.isPending || updateWarehouseMutation.isPending}
        mode={selectedWarehouse ? "edit" : "create"}
      />
    </div>
  );
}
