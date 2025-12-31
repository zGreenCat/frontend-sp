"use client";

import { useState } from "react";
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
import { Plus, Eye, Edit, Search, QrCode, ChevronLeft, ChevronRight, LayoutGrid, List, MapPin } from "lucide-react";
import { Box } from "@/domain/entities/Box";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";
import { BoxDialog } from "@/presentation/components/BoxDialog";
import { BoxesTable } from "@/presentation/components/BoxesTable";
import { useBoxes, useCreateBox, useUpdateBox, useFindBoxByQr } from "@/hooks/useBoxes";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { CreateBoxInput } from "@/shared/schemas";
import { BOX_STATUS } from "@/shared/constants";
import { cn } from "@/lib/utils";

type BoxViewMode = "grid" | "table";

export function BoxesView() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);

  // Vista: grid o tabla
  const [viewMode, setViewMode] = useState<BoxViewMode>("grid");

  // Filtros y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 12;

  // Búsqueda por QR
  const [qrSearchTerm, setQrSearchTerm] = useState("");

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

  const createBoxMutation = useCreateBox();
  const updateBoxMutation = useUpdateBox();
  const findBoxByQrMutation = useFindBoxByQr();

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
        description: error?.message || "No se pudo crear la caja. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (data: CreateBoxInput) => {
    if (!selectedBox) return;

    try {
      const updatedBox = await updateBoxMutation.mutateAsync({
        id: selectedBox.id,
        data: {
          id: selectedBox.id,
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

      setDialogOpen(false);
      setSelectedBox(null);
    } catch (error: any) {
      console.error("Error al actualizar caja:", error);
      toast({
        title: "❌ Error al actualizar caja",
        description: error?.message || "No se pudo actualizar la caja. Intenta nuevamente.",
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

  const handleSearchByQr = async () => {
    if (!qrSearchTerm.trim()) {
      toast({
        title: "⚠️ Campo vacío",
        description: "Ingresa un código QR para buscar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const box = await findBoxByQrMutation.mutateAsync(qrSearchTerm.trim());

      if (box) {
        toast({
          title: "✅ Caja encontrada",
          description: `Redirigiendo al detalle de "${box.qrCode}"...`,
        });
        router.push(`/boxes/${box.id}`);
      } else {
        toast({
          title: "❌ No encontrada",
          description: `No se encontró ninguna caja con el código QR "${qrSearchTerm}".`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error al buscar por QR:", error);
      toast({
        title: "❌ Error en búsqueda",
        description: error?.message || "No se pudo buscar la caja.",
        variant: "destructive",
      });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Cajas</h1>
          <p className="text-muted-foreground">Gestión de contenedores y embalajes</p>
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

      {/* Búsqueda por QR */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Buscar caja por código QR (Ej: BOX-001)..."
                value={qrSearchTerm}
                onChange={(e) => setQrSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchByQr();
                }}
                className="h-10"
              />
            </div>
            <Button
              onClick={handleSearchByQr}
              disabled={findBoxByQrMutation.isPending}
              className="h-10 gap-2"
            >
              <QrCode className="h-4 w-4" />
              Buscar QR
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código QR..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reset a página 1 al buscar
              }}
              className="h-10 pl-9"
            />
          </div>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px] h-10">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value={BOX_STATUS.DISPONIBLE}>Disponible</SelectItem>
            <SelectItem value={BOX_STATUS.EN_REPARACION}>En reparación</SelectItem>
            <SelectItem value={BOX_STATUS.DANADA}>Dañada</SelectItem>
            <SelectItem value={BOX_STATUS.RETIRADA}>Retirada</SelectItem>
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
              viewMode === "grid" && "bg-primary text-primary-foreground hover:bg-primary/90"
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
              viewMode === "table" && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Tabla</span>
          </Button>
        </div>
      </div>

      {/* Resultados y paginación */}
      {!loading && totalBoxes > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Mostrando {boxes.length} de {totalBoxes} caja(s)
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
      ) : boxes.length === 0 ? (
        <EmptyState message="No se encontraron cajas" />
      ) : (
        <>
          {/* Vista Grid (Cards) */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boxes.map((box) => (
                <Card key={box.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-base font-mono">
                        {box.qrCode}
                      </Badge>
                      <EntityBadge status={box.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {box.description && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Descripción</p>
                        <p className="text-sm text-foreground line-clamp-2">{box.description}</p>
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

                    {/* Bodega (nuevo) */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Ubicación</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0" />
                        {box.warehouseName || box.warehouse?.name ? (
                          <p className="text-sm font-medium text-foreground">
                            {box.warehouseName || box.warehouse?.name}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 italic">
                            Sin bodega asignada
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-9 gap-2"
                        onClick={() => goToDetail(box.id)}
                      >
                        <Eye className="h-4 w-4" />
                        Ver Detalle
                      </Button>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(box)}
                          className="h-9 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Vista Tabla */}
          {viewMode === "table" && (
            <Card>
              <CardContent className="p-0">
                <BoxesTable
                  boxes={boxes}
                  canEdit={canEdit}
                  onViewDetail={goToDetail}
                  onEdit={openEditDialog}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialog para crear/editar caja */}
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
    </div>
  );
}
