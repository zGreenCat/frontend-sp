"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  X,
  Loader2,
  Eye,
  Users,
  Warehouse,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Area } from "@/domain/entities/Area";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";
import { AreaDialog } from "@/presentation/components/AreaDialog";
import { CreateAreaInput } from "@/shared/schemas";
import { useToast } from "@/hooks/use-toast";
import { useAreas, useCreateArea } from "@/hooks/useAreas";

export function AreasView() {
  const router = useRouter();
  const { toast } = useToast();

  // React Query hooks - data fetching con caché automático
  const { data: areas = [], isLoading: areasLoading } = useAreas();
  const createAreaMutation = useCreateArea();

  // UI state
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  const loading = areasLoading;
  // ✅ Los contadores ahora vienen directamente del backend en cada área

  // Helper para obtener estado string a partir de isActive/status
  const getAreaStatus = (area: any): "ACTIVO" | "INACTIVO" => {
    if (typeof area.isActive === "boolean") {
      return area.isActive ? "ACTIVO" : "INACTIVO";
    }
    return area.status === "ACTIVO" ? "ACTIVO" : "INACTIVO";
  };

  // Helper que aplica TODOS los filtros a un nodo individual
  const matchesFilters = (area: Area): boolean => {
    const areaStatus = getAreaStatus(area as any);

    const backendLevel = area.level ?? 0;
    const visualLevel = backendLevel + 1; // Nivel 1 = ROOT(level 0)...

    const matchesSearch =
      !search ||
      area.name.toLowerCase().includes(search.toLowerCase());

    const matchesLevel =
      filterLevel === "all" ||
      visualLevel.toString() === filterLevel;

    const matchesStatus =
      filterStatus === "all" || areaStatus === filterStatus;

    return matchesSearch && matchesLevel && matchesStatus;
  };

  // Obtener solo las áreas ROOT (nodeType = ROOT) y aplicar filtros
  const getRootAreas = () => {
    return areas.filter((a: any) => {
      const nodeType = a.nodeType;
      if (nodeType !== "ROOT") {
        return false;
      }
      return matchesFilters(a);
    });
  };

  const openCreateDialog = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleCreateArea = async (data: CreateAreaInput) => {
    try {
      await createAreaMutation.mutateAsync({
        name: data.name,
        parentId: data.parentId ?? null,
      });

      toast({
        title: "✅ Área creada",
        description: `El área "${data.name}" se creó correctamente.`,
      });
      setDialogOpen(false);
      // ✅ React Query invalida automáticamente la caché en useCreateArea
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo crear el área",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilterLevel("all");
    setFilterStatus("all");
  };

  const hasActiveFilters =
    !!search || filterLevel !== "all" || filterStatus !== "all";

  const toggleArea = (areaId: string) => {
    setExpandedAreas((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(areaId)) newSet.delete(areaId);
      else newSet.add(areaId);
      return newSet;
    });
  };

  // 🔁 Render recursivo de cualquier nodo (ROOT o CHILD)
  const renderAreaNode = (area: Area, depth = 0): ReactNode => {
    // Si este nodo no pasa los filtros, no lo mostramos (ni su subárbol)
    if (!matchesFilters(area)) {
      return null;
    }

    const anyArea: any = area;
    const areaStatus = getAreaStatus(area as any);

    const backendLevel = area.level ?? depth;
    const visualLevel = backendLevel + 1;


    // Buscar los hijos COMPLETOS desde el array principal de áreas
    // usando los IDs del array children
    const childrenIds = (anyArea.children || []).map((c: any) => c.id);
    const fullChildAreas = areas.filter((a: any) => childrenIds.includes(a.id));

    // Aplicamos filtros también a los hijos
    const childAreas = fullChildAreas.filter((child) => matchesFilters(child));
    const hasChildren = childAreas.length > 0;

    const isExpanded = expandedAreas.has(area.id);
    const isRootArea = anyArea.nodeType === "ROOT" || depth === 0;

    return (
      <div key={area.id} className="space-y-1">
        <div
          className={`flex items-center gap-3 p-4 rounded-lg transition-all cursor-pointer ${
            isRootArea
              ? "bg-primary/5 border-l-4 border-primary hover:bg-primary/10"
              : "bg-secondary/30 hover:bg-secondary/50 border-l-2 border-muted ml-4"
          }`}
        >
          {/* Chevron si tiene hijos */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleArea(area.id);
              }}
              className="flex-shrink-0 hover:bg-primary/10 rounded p-1 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-primary" />
              ) : (
                <ChevronRight className="h-5 w-5 text-primary" />
              )}
            </button>
          ) : (
            <div className="w-7" />
          )}

          <div
            className="flex-1 flex items-center gap-3"
            onClick={() => hasChildren && toggleArea(area.id)}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p
                  className={`font-medium text-foreground ${
                    isRootArea ? "text-base" : "text-sm"
                  }`}
                >
                  {area.name}
                </p>
                <EntityBadge status={areaStatus} />
                {isRootArea && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    Área Principal
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  Nivel {visualLevel}
                </span>
                {/* Contador de sub-áreas - desde backend */}
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {area.subAreasCount ?? 0}{" "}
                  {(area.subAreasCount ?? 0) === 1 ? "subárea" : "subáreas"}
                </span>
                {/* Contador de bodegas - desde backend */}
                <span className="text-xs text-muted-foreground">•</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Warehouse className="h-3 w-3" />
                  {area.warehousesCount ?? 0}{" "}
                  {(area.warehousesCount ?? 0) === 1 ? "bodega" : "bodegas"}
                </span>
                {/* Contador de jefes - desde backend */}
                <span className="text-xs text-muted-foreground">•</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {area.managersCount ?? 0}{" "}
                  {(area.managersCount ?? 0) === 1 ? "jefe" : "jefes"}
                </span>
              </div>
            </div>

            <div
              className="flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/areas/${area.id}`)}
                className="gap-2 h-9"
              >
                <Eye className="h-4 w-4" />
                Ver Detalle
              </Button>
            </div>
          </div>
        </div>

        {/* Hijos recursivos */}
        {isExpanded && hasChildren && (
          <div className="space-y-1 ml-4">
            {childAreas.map((child) => renderAreaNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderAreaTree = () => {
    const rootAreas = getRootAreas();
    console.log("Root areas en render:", rootAreas);
    return rootAreas.map((area) => renderAreaNode(area, 0));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Áreas</h1>
          <p className="text-muted-foreground">
            Gestiona la estructura jerárquica de áreas • {areas.length}{" "}
            {areas.length === 1 ? "área" : "áreas"}
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-primary text-primary-foreground h-10 gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Área
        </Button>
      </div>

      {/* Filtros */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {/* Filtro por Nivel */}
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-full lg:w-[200px] h-10">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todos los niveles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                <SelectItem value="1">Nivel 1 (Principal)</SelectItem>
                <SelectItem value="2">Nivel 2 (Dependiente)</SelectItem>
                <SelectItem value="3">Nivel 3</SelectItem>
                <SelectItem value="4">Nivel 4</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por Estado */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-[180px] h-10">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="ACTIVO">✅ Activo</SelectItem>
                <SelectItem value="INACTIVO">⛔ Inactivo</SelectItem>
              </SelectContent>
            </Select>

            {/* Limpiar filtros */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="gap-2 h-10"
              >
                <X className="h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Árbol de áreas */}
      <Card className="shadow-sm">
        <CardHeader>
          <h3 className="text-lg font-semibold text-foreground">
            Jerarquía de Áreas
          </h3>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Cargando áreas...
                </p>
              </div>
            </div>
          ) : getRootAreas().length === 0 ? (
            <EmptyState
              message={
                hasActiveFilters
                  ? "No se encontraron áreas con los filtros aplicados"
                  : "No se encontraron áreas"
              }
            />
          ) : (
            <div className="space-y-2">{renderAreaTree()}</div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear área */}
      <AreaDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onSubmit={handleCreateArea}
        isLoading={createAreaMutation.isPending}
        mode="create"
      />
    </div>
  );
}
