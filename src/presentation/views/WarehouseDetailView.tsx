"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Eye,
  Link2,
  Building2,
  Users,
} from "lucide-react";
import { useWarehouseById, useWarehouseSupervisors } from "@/hooks/useWarehouses";
import { useWarehouseMovements } from "@/hooks/useWarehouseMovements";
import { useBoxes } from "@/hooks/useBoxes";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { WarehouseDialog } from "@/presentation/components/WarehouseDialog";
import { WarehouseAssignmentsDialog } from "@/presentation/components/WarehouseAssignmentsDialog";
import { EmptyState } from "@/presentation/components/EmptyState";
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
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const { toast } = useToast();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignmentsDialogOpen, setAssignmentsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [supervisorsPage, setSupervisorsPage] = useState(1);
  const limit = 10;
  const supervisorsLimit = 10;

  const canEdit = can("warehouses:edit");
  
  // Leer returnUrl de la query string
  const returnUrl = searchParams.get("returnUrl");
  
  // Función para manejar la navegación de regreso
  const handleBack = () => {
    if (returnUrl) {
      router.push(returnUrl);
    } else {
      router.push("/warehouses");
    }
  };
  
  // Texto dinámico del botón de volver
  const backButtonText = returnUrl ? "Volver al Área" : "Volver a Bodegas";

  // Queries
  const { data: warehouse, isLoading: loadingWarehouse } = useWarehouseById(warehouseId);
  const { data: movementsData, isLoading: loadingMovements } = useWarehouseMovements(
    warehouseId,
    currentPage,
    limit
  );
  const { data: boxesData, isLoading: loadingBoxes } = useBoxes({
    warehouseId,
    page: 1,
    limit: 100, // Mostrar todas las cajas de la bodega
  });
  const { data: supervisorsData, isLoading: loadingSupervisors } = useWarehouseSupervisors(
    warehouseId,
    supervisorsPage,
    supervisorsLimit
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
      {/* Header con breadcrumbs y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {backButtonText}
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
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssignmentsDialogOpen(true)}
                  className="gap-2"
                >
                  <Link2 className="h-4 w-4" />
                  Gestionar asignaciones
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Card de información general - Siempre visible */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Datos de la Bodega
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna izquierda */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{warehouse.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
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
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Área asignada
                </p>
                {warehouse.areaName ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-secondary/60 px-3 py-1">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {warehouse.areaName}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Sin área asignada
                  </p>
                )}
              </div>
            </div>

            {/* Columna derecha */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Capacidad Máxima
                </p>
                <p className="font-medium">
                  {(
                    warehouse.maxCapacityKg ||
                    warehouse.capacityKg ||
                    0
                  ).toLocaleString()}{" "}
                  Kg
                </p>
              </div>
              {warehouse.createdAt && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Fecha de Creación
                  </p>
                  <p className="font-medium">
                    {format(new Date(warehouse.createdAt), "dd MMM yyyy, HH:mm", {
                      locale: es,
                    })}
                  </p>
                </div>
              )}
              {/* Supervisores ahora están en un tab independiente */}
              <div>
                <p className="text-sm text-muted-foreground">ID de la Bodega</p>
                <p className="font-mono text-xs">{warehouse.id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para contenido dinámico */}
      <Tabs defaultValue="boxes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="boxes" className="gap-2">
            <Package className="h-4 w-4" />
            Cajas ({boxesData?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="supervisors" className="gap-2">
            <Users className="h-4 w-4" />
            Supervisores ({supervisorsData?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Tab: Cajas */}
        <TabsContent value="boxes">
          <Card>
            <CardHeader>
              <CardTitle>Cajas en esta Bodega</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBoxes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !boxesData || boxesData.data.length === 0 ? (
                <EmptyState message="Esta bodega aún no tiene cajas asociadas" />
              ) : (
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {boxesData.data.map((box) => (
                      <div
                        key={box.id}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/boxes/${box.id}?returnUrl=/warehouses/${warehouseId}`)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono text-sm font-medium text-primary">
                              {box.qrCode}
                            </p>
                            <EntityBadge status={box.status} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Tipo:</span>
                              <EntityBadge status={box.type} />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Peso:</span>
                              <span className="font-medium">
                                {box.currentWeightKg?.toLocaleString() || 0} Kg
                              </span>
                            </div>
                            {box.createdAt && (
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Creada:</span>
                                <span>
                                  {format(new Date(box.createdAt), "dd MMM yyyy", { locale: es })}
                                </span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full gap-2 mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/boxes/${box.id}?returnUrl=/warehouses/${warehouseId}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            Ver detalle
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-muted-foreground mt-4">
                    Total: {boxesData.total} {boxesData.total === 1 ? "caja" : "cajas"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Supervisores */}
        <TabsContent value="supervisors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Supervisores Asignados</CardTitle>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssignmentsDialogOpen(true)}
                  className="gap-2"
                >
                  <Link2 className="h-4 w-4" />
                  Gestionar Supervisores
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loadingSupervisors ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !supervisorsData || supervisorsData.data.length === 0 ? (
                <EmptyState message="Esta bodega no tiene supervisores asignados" />
              ) : (
                <>
                  <div className="space-y-3">
                    {supervisorsData.data.map((sup) => (
                      <div
                        key={sup.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{sup.fullName}</p>
                            <p className="text-sm text-muted-foreground">{sup.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-muted-foreground">{sup.role}</p>
                          <p className="text-xs text-muted-foreground">
                            Asignado el {format(new Date(sup.assignedAt), "dd MMM yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Paginación de supervisores */}
                  {supervisorsData.totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setSupervisorsPage((p) => Math.max(1, p - 1))}
                              className={
                                supervisorsPage === 1
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>

                          {Array.from({ length: supervisorsData.totalPages }, (_, i) => i + 1).map(
                            (page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setSupervisorsPage(page)}
                                  isActive={supervisorsPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          )}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                setSupervisorsPage((p) =>
                                  Math.min(supervisorsData.totalPages, p + 1)
                                )
                              }
                              className={
                                supervisorsPage === supervisorsData.totalPages
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>

                      <p className="text-center text-sm text-muted-foreground mt-2">
                        Mostrando {supervisorsData.data.length} de {supervisorsData.total} supervisores
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Movimientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMovements ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !movementsData || movementsData.data.length === 0 ? (
                <EmptyState message="Esta bodega aún no tiene movimientos registrados" />
              ) : (
                <>
                  <div className="space-y-4">
                    {movementsData.data.map((movement) => (
                      <div
                        key={movement.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
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

      {/* Assignments Dialog */}
      {warehouse && (
        <WarehouseAssignmentsDialog
          open={assignmentsDialogOpen}
          onOpenChange={setAssignmentsDialogOpen}
          warehouseId={warehouse.id}
          warehouseName={warehouse.name}
          currentAreaId={warehouse.areaId}
          currentAreaAssignmentId={warehouse.assignmentId}
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
