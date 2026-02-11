"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Edit, Link2, ChevronLeft, ChevronRight } from "lucide-react";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";
import { WarehouseDialog } from "@/presentation/components/WarehouseDialog";
import { WarehouseAssignmentsDialog } from "@/presentation/components/WarehouseAssignmentsDialog";
import { WarehouseFilterBar } from "@/presentation/components/WarehouseFilterBar";
import {
  useWarehousesWithFilters,
  useCreateWarehouse,
  useUpdateWarehouse,
  useWarehouseSupervisors,
} from "@/hooks/useWarehouses";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { CreateWarehouseInput } from "@/shared/schemas";
import { Warehouse } from "@/domain/entities/Warehouse";
import { WarehouseQuery } from "@/shared/types/warehouse-filters.types";

// Helper para parsear query params desde URL
const parseQueryParams = (searchParams: URLSearchParams): WarehouseQuery => {
  return {
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10,
    search: searchParams.get("search") || undefined,
    isEnabled: searchParams.get("isEnabled") === "true" ? true : searchParams.get("isEnabled") === "false" ? false : undefined,
    sortBy: (searchParams.get("sortBy") as any) || "createdAt",
    order: (searchParams.get("order") as any) || "desc",
  };
};

// Helper para construir query params hacia URL
const buildQueryParams = (filters: WarehouseQuery): URLSearchParams => {
  const params = new URLSearchParams();
  params.set("page", filters.page.toString());
  if (filters.limit) params.set("limit", filters.limit.toString());
  if (filters.search) params.set("search", filters.search);
  if (filters.isEnabled !== undefined) params.set("isEnabled", filters.isEnabled.toString());
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.order) params.set("order", filters.order);
  return params;
};

export function WarehousesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estado de filtros inicializado desde URL
  const [filters, setFilters] = useState<WarehouseQuery>(() => parseQueryParams(searchParams));
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignmentsDialogOpen, setAssignmentsDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [warehouseForAssignments, setWarehouseForAssignments] = useState<Warehouse | null>(null);

  // React Query hooks con filtros
  const { data: warehousesData, isLoading: loading } = useWarehousesWithFilters(filters);
  const createWarehouseMutation = useCreateWarehouse();
  const updateWarehouseMutation = useUpdateWarehouse();
  
  // Obtener supervisores del warehouse seleccionado para asignaciones
  const { data: supervisorsData } = useWarehouseSupervisors(
    warehouseForAssignments?.id || '',
    1,
    100,
  );

  // Permisos y toasts
  const { can } = usePermissions();
  const { toast } = useToast();

  const canCreate = can("warehouses:create");
  const canEdit = can("warehouses:edit");

  // Sincronizar filtros con URL
  const syncUrlWithFilters = useCallback(() => {
    const params = buildQueryParams(filters);
    router.push(`/warehouses?${params.toString()}`, { scroll: false });
  }, [filters, router]);

  useEffect(() => {
    syncUrlWithFilters();
  }, [syncUrlWithFilters]);

  // Handler para cambios de filtros (con reset de página)
  const handleFiltersChange = useCallback((newFilters: Partial<WarehouseQuery>) => {
    setFilters((prev) => {
      // Si cambió algo diferente a page, resetear page a 1
      const shouldResetPage = Object.keys(newFilters).some(key => key !== 'page');
      return {
        ...prev,
        ...newFilters,
        page: shouldResetPage && !newFilters.page ? 1 : (newFilters.page || prev.page),
      };
    });
  }, []);

  // Handler para cambio de página
  const handlePageChange = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleCreate = async (data: CreateWarehouseInput) => {
    try {
      const createdWarehouse = await createWarehouseMutation.mutateAsync(data);

      toast({
        title: "✅ Bodega creada",
        description: `La bodega "${createdWarehouse.name}" ha sido creada exitosamente con capacidad de ${createdWarehouse.maxCapacityKg} Kg.`,
      });

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

  const handleSubmit = async (data: CreateWarehouseInput) => {
    if (selectedWarehouse) {
      await handleEdit(data);
    } else {
      await handleCreate(data);
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

  const openAssignmentsDialog = (warehouse: Warehouse) => {
    setWarehouseForAssignments(warehouse);
    setAssignmentsDialogOpen(true);
  };

  const warehouses = warehousesData?.data || [];
  const totalPages = warehousesData?.totalPages || 0;
  const currentPage = warehousesData?.page || 1;

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

      {/* Barra de filtros */}
      <WarehouseFilterBar filters={filters} onFiltersChange={handleFiltersChange} />

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : warehouses.length === 0 ? (
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
                  {warehouses.map((warehouse) => (
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
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(warehouse)}
                              className="h-8 gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAssignmentsDialog(warehouse)}
                              className="h-8 w-8 p-0 text-primary hover:text-primary/80 hover:bg-primary/10"
                              title="Gestionar asignaciones"
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="gap-2"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
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

      {/* Dialog para gestionar asignaciones */}
      {warehouseForAssignments && (
        <WarehouseAssignmentsDialog
          open={assignmentsDialogOpen}
          onOpenChange={setAssignmentsDialogOpen}
          warehouseId={warehouseForAssignments.id}
          warehouseName={warehouseForAssignments.name}
          currentAreaId={warehouseForAssignments.areaId}
          currentAreaAssignmentId={warehouseForAssignments.assignmentId}
          currentSupervisors={
            supervisorsData?.data?.map((s) => ({
              userId: s.id,
              fullName: s.fullName,
              assignmentId: s.assignmentId || '',
            })) || []
          }
        />
      )}
    </div>
  );
}
