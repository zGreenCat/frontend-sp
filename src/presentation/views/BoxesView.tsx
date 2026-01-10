"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Eye,
  Edit,
  Search,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  MapPin,
  TruckIcon,
  ToggleLeft,
} from "lucide-react";
import { Box } from "@/domain/entities/Box";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";
import { BoxDialog } from "@/presentation/components/BoxDialog";
import { BoxesTable } from "@/presentation/components/BoxesTable";
import { MoveBoxDialog } from "@/presentation/components/MoveBoxDialog";
import { ChangeBoxStatusDialog } from "@/presentation/components/ChangeBoxStatusDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useBoxes,
  useCreateBox,
  useUpdateBox,
} from "@/hooks/useBoxes";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { CreateBoxInput } from "@/shared/schemas";
import { BOX_STATUS, BOX_TYPES } from "@/shared/constants";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

type BoxViewMode = "grid" | "table";

export function BoxesView() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);

  // Estado para los 3 diálogos de edición separados
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedBoxForMove, setSelectedBoxForMove] = useState<Box | null>(null);
  const [selectedBoxForStatus, setSelectedBoxForStatus] = useState<Box | null>(null);

  // Vista: grid o tabla
  const [viewMode, setViewMode] = useState<BoxViewMode>("grid");

  // Filtros y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 12;

  // React Query hooks
  const filters = {
    page,
    limit,
    ...(searchTerm && { search: searchTerm }),
    ...(statusFilter !== "all" && { status: statusFilter }),
  };

  const { data: boxesResponse, isLoading: loading } = useBoxes(filters);
  const boxes = boxesResponse?.data || [];
  const totalBoxes = boxesResponse?.total || 0;
  const totalPages = Math.ceil(totalBoxes / limit);

  // Filtros adicionales aplicados en frontend (tipo y bodega)
  const filteredBoxes = useMemo(() => {
    return boxes.filter((box) => {
      // Filtro por tipo
      const matchType = typeFilter === "all" || box.type === typeFilter;

      // Filtro por bodega
      const hasWarehouse = !!(box.warehouseId || box.warehouseName || box.warehouse?.id);
      const matchWarehouse =
        warehouseFilter === "all" ||
        (warehouseFilter === "assigned" && hasWarehouse) ||
        (warehouseFilter === "unassigned" && !hasWarehouse);

      return matchType && matchWarehouse;
    });
  }, [boxes, typeFilter, warehouseFilter]);

  const createBoxMutation = useCreateBox();
  const updateBoxMutation = useUpdateBox();

  // Permisos y toasts
  const { can } = usePermissions();
  const { toast } = useToast();

  const canCreate = can("boxes:create");
  const canEdit = can("boxes:edit");

  const handleCreate = async (data: CreateBoxInput) => {
    try {
      const createdBox = await createBoxMutation.mutateAsync(data);

      toast({
        title: "✅ Caja creada",
        description: `La caja "${createdBox.qrCode}" ha sido creada exitosamente.`,
      });

      setDialogOpen(false);
      setSelectedBox(null);
    } catch (error: any) {
      console.error("Error al crear caja:", error);
      toast({
        title: "❌ Error al crear caja",
        description:
          error?.message || "No se pudo crear la caja. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (data: CreateBoxInput) => {
    if (!selectedBox) return;

    try {
      console.log("Updating box with data:", selectedBox.id, data);
      const updatedBox = await updateBoxMutation.mutateAsync({
        id: selectedBox.id,
        data: {
          description: data.description,
          type: data.type,
          currentWeightKg: data.currentWeightKg,
          // NO incluir status ni warehouseId (se editan por separado)
        },
      });
      toast({
        title: "✅ Caja actualizada",
        description: `Los datos de la caja "${updatedBox.qrCode}" han sido actualizados correctamente.`,
      });

      setDialogOpen(false);
      setSelectedBox(null);
    } catch (error: any) {
      console.error("Error al actualizar caja:", error);
      toast({
        title: "❌ Error al actualizar caja",
        description:
          error?.message ||
          "No se pudo actualizar la caja. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (data: CreateBoxInput) => {
    if (selectedBox) {
      await handleEdit(data);
    } else {
      await handleCreate(data);
    }
  };

  const openCreateDialog = () => {
    setSelectedBox(null);
    setDialogOpen(true);
  };

  const openEditDialog = (box: Box) => {
    setSelectedBox(box);
    setDialogOpen(true);
  };

  const openMoveDialog = (box: Box) => {
    setSelectedBoxForMove(box);
    setMoveDialogOpen(true);
  };

  const openStatusDialog = (box: Box) => {
    setSelectedBoxForStatus(box);
    setStatusDialogOpen(true);
  };

  const goToDetail = (boxId: string) => {
    router.push(`/boxes/${boxId}`);
  };

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <TooltipProvider>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Cajas</h1>
          <p className="text-muted-foreground">
            Gestión de contenedores y embalajes
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={openCreateDialog}
            className="bg-primary text-primary-foreground h-10 gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Caja
          </Button>
        )}
      </div>

      {/* Filtros y búsqueda unificada */}
      <div className="flex flex-col gap-3">
        {/* Primera fila: Búsqueda unificada */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código QR, descripción o tipo de caja..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="h-10 pl-9"
          />
        </div>

        {/* Segunda fila: Filtros y toggle vista */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filtro por estado */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-10">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value={BOX_STATUS.DISPONIBLE}>Disponible</SelectItem>
              <SelectItem value={BOX_STATUS.EN_REPARACION}>
                En reparación
              </SelectItem>
              <SelectItem value={BOX_STATUS.DANADA}>Dañada</SelectItem>
              <SelectItem value={BOX_STATUS.RETIRADA}>Retirada</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro por tipo */}
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-10">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value={BOX_TYPES.PEQUEÑA}>Pequeña</SelectItem>
              <SelectItem value={BOX_TYPES.NORMAL}>Normal</SelectItem>
              <SelectItem value={BOX_TYPES.GRANDE}>Grande</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro por bodega */}
          <Select
            value={warehouseFilter}
            onValueChange={(value) => {
              setWarehouseFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-10">
              <SelectValue placeholder="Filtrar por bodega" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las bodegas</SelectItem>
              <SelectItem value="assigned">Con bodega asignada</SelectItem>
              <SelectItem value="unassigned">Sin bodega asignada</SelectItem>
            </SelectContent>
          </Select>

          {/* Toggle Vista Grid/Tabla */}
          <div className="flex gap-1 border border-border rounded-md p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={cn(
              "h-8 gap-1.5",
              viewMode === "grid" &&
                "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Cards</span>
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className={cn(
              "h-8 gap-1.5",
              viewMode === "table" &&
                "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Tabla</span>
          </Button>
          </div>
        </div>
      </div>

      {/* Resultados y paginación */}
      {!loading && totalBoxes > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Mostrando {filteredBoxes.length} de {totalBoxes} caja(s)
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={page === 1}
                className="h-8 gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="px-2">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page === totalPages}
                className="h-8 gap-1"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Listado de cajas */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando...</div>
      ) : filteredBoxes.length === 0 ? (
        <EmptyState message="No se encontraron cajas con los filtros seleccionados" />
      ) : (
        // 👇 Aquí entra Framer Motion para animar el cambio grid ↔ tabla
        <div className="relative min-h-[200px]">
          <AnimatePresence mode="wait" initial={false}>
            {viewMode === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredBoxes.map((box) => (
  <Card
    key={box.id}
    className="shadow-sm hover:shadow-md transition-shadow"
  >
    <CardHeader>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-base font-mono">
          {box.qrCode}
        </Badge>
        {/* Estado: solo lectura, sin onClick */}
        <EntityBadge status={box.status} />
      </div>
    </CardHeader>

    <CardContent className="space-y-4">
      {box.description && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Descripción</p>
          <p className="text-sm text-foreground line-clamp-2">
            {box.description}
          </p>
        </div>
      )}

      <div>
        <p className="text-sm text-muted-foreground mb-1">Tipo</p>
        <EntityBadge status={box.type} />
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-1">Peso/Contenido</p>
        <p className="text-lg font-bold text-primary">
          {box.currentWeightKg.toFixed(1)} kg
        </p>
      </div>

      {/* Bodega */}
      <div>
        <p className="text-sm text-muted-foreground mb-1">Ubicación</p>
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0" />
          {box.warehouseName || (box as any).warehouse?.name ? (
            <p className="text-sm font-medium text-foreground truncate">
              {box.warehouseName || (box as any).warehouse?.name}
            </p>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Sin bodega asignada
            </p>
          )}
        </div>
      </div>

      {/* Acciones: iconos + Ver Detalle en una sola fila */}
<div className="flex items-center justify-between pt-2 gap-2">
  {/* Rail de acciones rápidas */}
  {canEdit && (
    <div className="flex items-center gap-1.5">
      {/* Cambiar estado */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openStatusDialog(box)}
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50
                       dark:text-blue-400 dark:hover:bg-blue-950"
          >
            <ToggleLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Cambiar estado de la caja</p>
        </TooltipContent>
      </Tooltip>

      {/* Mover bodega */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openMoveDialog(box)}
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50
                       dark:text-blue-400 dark:hover:bg-blue-950"
          >
            <TruckIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Cambiar bodega asignada</p>
        </TooltipContent>
      </Tooltip>

      {/* Editar datos maestros */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditDialog(box)}
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50
                       dark:text-blue-400 dark:hover:bg-blue-950"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Editar datos de la caja</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )}

  {/* CTA principal */}
  <Button
    variant="outline"
    className="flex-1 h-9 gap-2"
    onClick={() => goToDetail(box.id)}
  >
    <Eye className="h-4 w-4" />
    Ver Detalle
  </Button>
</div>

    </CardContent>
  </Card>
))}

              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <Card>
                  <CardContent className="p-0">
                    <BoxesTable
                      boxes={filteredBoxes}
                      canEdit={canEdit}
                      onViewDetail={goToDetail}
                      onEdit={openEditDialog}
                      onMove={openMoveDialog}
                      onChangeStatus={openStatusDialog}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Dialog para crear/editar DATOS MAESTROS de caja */}
      <BoxDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={
          selectedBox
            ? {
                qrCode: selectedBox.qrCode,
                description: selectedBox.description,
                type: selectedBox.type,
                status: selectedBox.status,
                currentWeightKg: selectedBox.currentWeightKg,
                warehouseId: selectedBox.warehouseId || "",
              }
            : undefined
        }
        isLoading={createBoxMutation.isPending || updateBoxMutation.isPending}
        mode={selectedBox ? "edit" : "create"}
      />

      {/* Dialog para MOVER bodega */}
      {selectedBoxForMove && (
        <MoveBoxDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          boxId={selectedBoxForMove.id}
          boxQrCode={selectedBoxForMove.qrCode}
          currentWarehouseId={selectedBoxForMove.warehouseId || ""}
        />
      )}

      {/* Dialog para CAMBIAR estado */}
      {selectedBoxForStatus && (
        <ChangeBoxStatusDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          boxId={selectedBoxForStatus.id}
          boxQrCode={selectedBoxForStatus.qrCode}
          currentStatus={selectedBoxForStatus.status}
        />
      )}
    </div>
    </TooltipProvider>
  );
}
