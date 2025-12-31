"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Edit, Package, History, Loader2, Calendar, User, TruckIcon, ToggleLeft, XCircle } from "lucide-react";
import { useBoxById, useBoxHistory, useUpdateBox } from "@/hooks/useBoxes";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { BoxDialog } from "@/presentation/components/BoxDialog";
import { MoveBoxDialog } from "@/presentation/components/MoveBoxDialog";
import { ChangeBoxStatusDialog } from "@/presentation/components/ChangeBoxStatusDialog";
import { DeactivateBoxDialog } from "@/presentation/components/DeactivateBoxDialog";
import { CreateBoxInput } from "@/shared/schemas";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BoxDetailViewProps {
  boxId: string;
}

export function BoxDetailView({ boxId }: BoxDetailViewProps) {
  const router = useRouter();
  const { can } = usePermissions();
  const { toast } = useToast();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  // Filtros para historial
  const [historyEventType, setHistoryEventType] = useState<string>("all");
  const [historyPage, setHistoryPage] = useState(1);
  const historyLimit = 10;

  const canEdit = can("boxes:edit");
  const canMove = canEdit; // Usar mismo permiso que edit
  const canDeactivate = canEdit; // Usar mismo permiso que edit

  // Queries
  const { data: box, isLoading: loadingBox } = useBoxById(boxId);

  const historyFilters = {
    page: historyPage,
    limit: historyLimit,
    ...(historyEventType !== "all" && { eventType: historyEventType }),
  };

  const { data: historyResponse, isLoading: loadingHistory } = useBoxHistory(boxId, historyFilters);
  const historyEvents = historyResponse?.data || [];
  const totalHistory = historyResponse?.total || 0;
  const totalHistoryPages = Math.ceil(totalHistory / historyLimit);

  const updateBoxMutation = useUpdateBox();

  const handleEdit = async (data: CreateBoxInput) => {
    if (!box) return;

    try {
      const updatedBox = await updateBoxMutation.mutateAsync({
        id: box.id,
        data: {
          id: box.id,
          description: data.description,
          type: data.type,
          status: data.status,
          currentWeightKg: data.currentWeightKg,
        },
      });

      toast({
        title: "✅ Caja actualizada",
        description: `La caja "${updatedBox.qrCode}" ha sido actualizada correctamente.`,
      });

      setEditDialogOpen(false);
    } catch (error: any) {
      console.error("Error al actualizar caja:", error);
      toast({
        title: "❌ Error al actualizar caja",
        description: error?.message || "No se pudo actualizar la caja. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  if (loadingBox) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!box) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Caja no encontrada</p>
        <Button onClick={() => router.push("/boxes")} className="mt-4">
          Volver a Cajas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/boxes")}
          className="gap-2 self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Cajas
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground font-mono">{box.qrCode}</h1>
            <EntityBadge status={box.status} />
          </div>

          <div className="flex flex-wrap gap-2">
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
            {canMove && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMoveDialogOpen(true)}
                className="gap-2"
              >
                <TruckIcon className="h-4 w-4" />
                Mover
              </Button>
            )}
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusDialogOpen(true)}
                className="gap-2"
              >
                <ToggleLeft className="h-4 w-4" />
                Cambiar Estado
              </Button>
            )}
            {canDeactivate && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeactivateDialogOpen(true)}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                Desactivar
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
              <CardTitle>Datos de la Caja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Código QR</p>
                  <p className="text-lg font-semibold font-mono">{box.qrCode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                  <p className="text-lg font-semibold">{box.type}</p>
                </div>
                {box.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                    <p className="text-base">{box.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <div className="mt-1">
                    <EntityBadge status={box.status} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Peso/Contenido Actual</p>
                  <p className="text-2xl font-bold text-primary">
                    {box.currentWeightKg.toFixed(1)} kg
                  </p>
                </div>
                {box.warehouse && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Bodega Actual</p>
                    <p className="text-lg font-semibold">{box.warehouse.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Capacidad: {box.warehouse.capacityKg.toFixed(0)} kg
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Placeholder para inventario (FASE 3) */}
          <Card>
            <CardHeader>
              <CardTitle>Inventario por Ubicación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Funcionalidad en desarrollo</p>
                <p className="text-sm mt-1">Pronto podrás ver el stock distribuido por ubicaciones</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Historial de Eventos</CardTitle>
              <Select
                value={historyEventType}
                onValueChange={(value) => {
                  setHistoryEventType(value);
                  setHistoryPage(1);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los eventos</SelectItem>
                  <SelectItem value="CREATED">Creación</SelectItem>
                  <SelectItem value="UPDATED">Actualización</SelectItem>
                  <SelectItem value="MOVED">Movimiento</SelectItem>
                  <SelectItem value="STATUS_CHANGED">Cambio de Estado</SelectItem>
                  <SelectItem value="DEACTIVATED">Desactivación</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </div>
              ) : historyEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay eventos registrados para esta caja
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {historyEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex flex-col gap-2 p-4 border rounded-lg hover:bg-secondary/20 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{event.eventType}</Badge>
                            </div>

                            {event.description && (
                              <p className="text-sm text-foreground mb-2">{event.description}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>Usuario: {event.userId}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {format(new Date(event.timestamp), "dd MMM yyyy, HH:mm", { locale: es })}
                                </span>
                              </div>
                            </div>

                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div className="mt-2 text-sm">
                                <span className="text-muted-foreground">Detalles:</span>{" "}
                                <code className="text-xs bg-secondary px-2 py-1 rounded">
                                  {JSON.stringify(event.metadata, null, 2)}
                                </code>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Paginación del historial */}
                  {totalHistoryPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage(historyPage - 1)}
                        disabled={historyPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {historyPage} de {totalHistoryPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage(historyPage + 1)}
                        disabled={historyPage === totalHistoryPages}
                      >
                        Siguiente
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {box && (
        <>
          <BoxDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSubmit={handleEdit}
            defaultValues={{
              qrCode: box.qrCode,
              description: box.description,
              type: box.type,
              status: box.status,
              currentWeightKg: box.currentWeightKg,
              warehouseId: box.warehouseId,
            }}
            isLoading={updateBoxMutation.isPending}
            mode="edit"
          />

          <MoveBoxDialog
            boxId={box.id}
            boxQrCode={box.qrCode}
            currentWarehouseId={box.warehouseId}
            open={moveDialogOpen}
            onOpenChange={setMoveDialogOpen}
          />

          <ChangeBoxStatusDialog
            boxId={box.id}
            boxQrCode={box.qrCode}
            currentStatus={box.status}
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
          />

          <DeactivateBoxDialog
            boxId={box.id}
            boxQrCode={box.qrCode}
            open={deactivateDialogOpen}
            onOpenChange={setDeactivateDialogOpen}
          />
        </>
      )}
    </div>
  );
}
