"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  History,
  Package,
  Loader2,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import { useWarehouseById } from "@/hooks/useWarehouses";
import { useWarehouseMovements } from "@/hooks/useWarehouseMovements";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { WarehouseDialog } from "@/presentation/components/WarehouseDialog";
import { useUpdateWarehouse } from "@/hooks/useWarehouses";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { CreateWarehouseInput } from "@/shared/schemas";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface WarehouseDetailViewProps {
  warehouseId: string;
}

const getMovementTypeBadge = (type: string) => {
  const badges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ADJUSTMENT: { label: "Ajuste", variant: "secondary" },
    IN: { label: "Entrada", variant: "default" },
    OUT: { label: "Salida", variant: "destructive" },
    TRANSFER: { label: "Transferencia", variant: "outline" },
    INVENTORY: { label: "Inventario", variant: "secondary" },
  };

  const config = badges[type] || { label: type, variant: "outline" };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export function WarehouseDetailView({ warehouseId }: WarehouseDetailViewProps) {
  const router = useRouter();
  const { can } = usePermissions();
  const { toast } = useToast();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const canEdit = can("warehouses:edit");

  // Queries
  const { data: warehouse, isLoading: loadingWarehouse } = useWarehouseById(warehouseId);
  const { data: movementsData, isLoading: loadingMovements } = useWarehouseMovements(
    warehouseId,
    currentPage,
    limit
  );

  const updateWarehouseMutation = useUpdateWarehouse();

  const handleEdit = async (data: CreateWarehouseInput) => {
    if (!warehouse) return;

    try {
      const updatedWarehouse = await updateWarehouseMutation.mutateAsync({
        id: warehouse.id,
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

      setEditDialogOpen(false);
    } catch (error: any) {
      console.error("Error al actualizar bodega:", error);
      toast({
        title: "❌ Error al actualizar bodega",
        description: error?.message || "No se pudo actualizar la bodega. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  if (loadingWarehouse) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Bodega no encontrada</p>
        <Button onClick={() => router.push("/warehouses")} className="mt-4">
          Volver a Bodegas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/warehouses")}
            className="gap-2 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Bodegas
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{warehouse.name}</h1>
            <EntityBadge
              status={
                typeof warehouse.status === "string"
                  ? warehouse.status
                  : warehouse.isEnabled
                  ? "ACTIVO"
                  : "INACTIVO"
              }
            />
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="info">
            <Package className="h-4 w-4 mr-2" />
            Información General
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Tab: Información General */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Datos de la Bodega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="text-lg font-semibold">{warehouse.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Capacidad Máxima</p>
                  <p className="text-lg font-semibold">
                    {(warehouse.maxCapacityKg || warehouse.capacityKg || 0).toLocaleString()} Kg
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <div className="mt-1">
                    <EntityBadge
                      status={
                        typeof warehouse.status === "string"
                          ? warehouse.status
                          : warehouse.isEnabled
                          ? "ACTIVO"
                          : "INACTIVO"
                      }
                    />
                  </div>
                </div>
                {warehouse.createdAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
                    <p className="text-lg">
                      {format(new Date(warehouse.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Movimientos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMovements ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !movementsData || movementsData.data.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay movimientos registrados para esta bodega
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {movementsData.data.map((movement) => (
                      <div
                        key={movement.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border rounded-lg hover:bg-secondary/20 transition-colors"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getMovementTypeBadge(movement.movementType)}
                            {movement.boxCode && (
                              <Badge variant="outline" className="gap-1">
                                <Package className="h-3 w-3" />
                                {movement.boxCode}
                              </Badge>
                            )}
                          </div>
                          
                          {movement.notes && (
                            <div className="flex items-start gap-2 text-sm">
                              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <p className="text-foreground">{movement.notes}</p>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{movement.performedByName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(new Date(movement.occurredAt), "dd MMM yyyy, HH:mm", { locale: es })}
                              </span>
                            </div>
                            {movement.referenceDocument && (
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span>Doc: {movement.referenceDocument}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {movement.quantity !== 0 && (
                          <div className="text-right">
                            <p className="text-2xl font-bold">
                              {movement.quantity > 0 ? "+" : ""}
                              {movement.quantity}
                            </p>
                            <p className="text-xs text-muted-foreground">Kg</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Paginación */}
                  {movementsData.totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: movementsData.totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                setCurrentPage((p) => Math.min(movementsData.totalPages, p + 1))
                              }
                              className={
                                currentPage === movementsData.totalPages
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>

                      <p className="text-center text-sm text-muted-foreground mt-2">
                        Mostrando {movementsData.data.length} de {movementsData.total} movimientos
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {warehouse && (
        <WarehouseDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSubmit={handleEdit}
          defaultValues={{
            name: warehouse.name,
            maxCapacityKg: warehouse.maxCapacityKg || warehouse.capacityKg || 900,
            isEnabled: warehouse.isEnabled ?? (warehouse.status === "ACTIVO"),
          }}
          isLoading={updateWarehouseMutation.isPending}
          mode="edit"
        />
      )}
    </div>
  );
}
