"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";
import { WarehouseDialog } from "@/presentation/components/WarehouseDialog";
import { useWarehouses, useCreateWarehouse } from "@/hooks/useWarehouses";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { CreateWarehouseInput } from "@/shared/schemas";

export function WarehousesView() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // React Query hooks
  const { data: warehouses = [], isLoading: loading } = useWarehouses();
  const createWarehouseMutation = useCreateWarehouse();

  // Permisos y toasts
  const { can } = usePermissions();
  const { toast } = useToast();

  const canCreate = can("WAREHOUSES_CREATE");

  const filteredWarehouses = warehouses.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (data: CreateWarehouseInput) => {
    setActionLoading(true);
    try {
      const createdWarehouse = await createWarehouseMutation.mutateAsync(data);

      toast({
        title: "✅ Bodega creada",
        description: `La bodega "${createdWarehouse.name}" ha sido creada exitosamente con capacidad de ${createdWarehouse.maxCapacityKg} Kg.`,
      });

      setDialogOpen(false);
    } catch (error: any) {
      console.error("Error al crear bodega:", error);
      toast({
        title: "❌ Error al crear bodega",
        description: error?.message || "No se pudo crear la bodega. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateDialog = () => {
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
                  </tr>
                </thead>
                <tbody>
                  {filteredWarehouses.map((warehouse) => (
                    <tr
                      key={warehouse.id}
                      className="border-b border-border hover:bg-secondary/20 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium text-foreground">
                        {warehouse.name}
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
                        {warehouse.areaId ? `Área ${warehouse.areaId}` : "Sin asignar"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear bodega */}
      <WarehouseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        isLoading={actionLoading}
        mode="create"
      />
    </div>
  );
}
