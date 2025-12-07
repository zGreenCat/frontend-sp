"use client";

import { useState, useEffect } from "react";
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
import { Plus, ChevronRight, ChevronDown, Search, Filter, X, Edit, Loader2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { Area } from "@/domain/entities/Area";
import { TENANT_ID } from "@/shared/constants";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";
import { AreaDialog } from "@/presentation/components/AreaDialog";
import { CreateAreaInput } from "@/shared/schemas";
import { CreateArea } from "@/application/usecases/area/CreateArea";
import { UpdateArea } from "@/application/usecases/area/UpdateArea";
import { useToast } from "@/hooks/use-toast";

export function AreasView() {
  const router = useRouter();
  const { areaRepo } = useRepositories();
  const { toast } = useToast();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    setLoading(true);
    const result = await areaRepo.findAll(TENANT_ID);
    console.log('Loaded areas:', result);
    setAreas(result);
    setLoading(false);
  };

  // Obtener solo áreas ROOT (principales) - aplicar filtros
  const getRootAreas = () => {
    return areas.filter(a => {
      const nodeType = (a as any).nodeType;
      if (nodeType !== 'ROOT') {
        console.log(`Omitiendo área ${a.name} de tipo ${nodeType}`);
        return false;
      }
      // Aplicar filtros solo a las ROOT
      const areaStatus = (a as any).isActive ? 'ACTIVO' : 'INACTIVO';
      const matchesSearch = !search || a.name.toLowerCase().includes(search.toLowerCase());
      const matchesLevel = filterLevel === "all" || a.level.toString() === filterLevel;
      const matchesStatus = filterStatus === "all" || areaStatus === filterStatus;
      console.log(`Área ${a.name}: matchesSearch=${matchesSearch}, matchesLevel=${matchesLevel}, matchesStatus=${matchesStatus}`);
      return matchesSearch && matchesLevel && matchesStatus;
    });
  };

  // Obtener áreas hijas desde el array children del área ROOT
  const getChildrenFromArea = (area: Area) => {
    const children = (area as any).children || [];
    
    // Buscar los objetos completos de cada child en el array de áreas
    return children.map((child: any) => {
      const fullChild = areas.find(a => a.id === child.id);
      return fullChild || child;
    }).filter((child: any) => {
      // Aplicar filtros también a los hijos
      const matchesSearch = !search || child.name?.toLowerCase().includes(search.toLowerCase());
      const matchesLevel = filterLevel === "all" || child.level?.toString() === filterLevel;
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "ACTIVO" ? child.isActive === true : child.isActive === false);
      
      return matchesSearch && matchesLevel && matchesStatus;
    });
  };

  const handleCreateArea = async (data: CreateAreaInput) => {
    setActionLoading(true);
    try {
      const useCase = new CreateArea(areaRepo);
      // Convertir data a formato correcto con status tipado
      const areaData: Omit<Area, 'id'> = {
        name: data.name,
        level: data.level,
        parentId: data.parentId,
        status: data.status as 'ACTIVO' | 'INACTIVO',
        tenantId: data.tenantId,
      };
      const result = await useCase.execute(areaData);

      if (result.ok) {
        toast({
          title: "✅ Área creada",
          description: `El área "${data.name}" se creó correctamente.`,
        });
        setDialogOpen(false);
        await loadAreas();
      } else {
        toast({
          title: "❌ Error al crear área",
          description: result.error || "Ocurrió un error inesperado",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo crear el área",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditArea = async (data: CreateAreaInput) => {
    if (!selectedArea) return;
    
    setActionLoading(true);
    try {
      const useCase = new UpdateArea(areaRepo);
      // Convertir data a formato correcto con status tipado
      const updates: Partial<Area> = {
        name: data.name,
        level: data.level,
        parentId: data.parentId,
        status: data.status as 'ACTIVO' | 'INACTIVO',
        tenantId: data.tenantId,
      };
      const result = await useCase.execute(selectedArea.id, updates, TENANT_ID);

      if (result.ok) {
        toast({
          title: "✅ Área actualizada",
          description: `El área "${data.name}" se actualizó correctamente.`,
        });
        setDialogOpen(false);
        setSelectedArea(null);
        await loadAreas();
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

  const openCreateDialog = () => {
    setSelectedArea(null);
    setDialogOpen(true);
  };

  const openEditDialog = (area: Area) => {
    setSelectedArea(area);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedArea(null);
  };

  const clearFilters = () => {
    setSearch("");
    setFilterLevel("all");
    setFilterStatus("all");
  };

  const hasActiveFilters = search || filterLevel !== "all" || filterStatus !== "all";

  const toggleArea = (areaId: string) => {
    setExpandedAreas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(areaId)) {
        newSet.delete(areaId);
      } else {
        newSet.add(areaId);
      }
      return newSet;
    });
  };

  const renderAreaTree = () => {
    const rootAreas = getRootAreas();
    console.log("Root areas en render:", rootAreas);
    return rootAreas.map((area: Area) => {
      console.log("ROOT area:", area.name, "children raw:", (area as any).children);
      // El backend envía isActive en lugar de status ACTIVO/INACTIVO
      const areaStatus = (area as any).isActive !== undefined 
        ? ((area as any).isActive ? 'ACTIVO' : 'INACTIVO')
        : area.status;
      
      // Nivel visual basado en el nivel del backend: ROOT level=0 -> Nivel 1, CHILD level=1 -> Nivel 2
      const backendLevel = area.level;
      const visualLevel = backendLevel + 1;
      
      // Obtener hijos desde el array children
      const childAreas = getChildrenFromArea(area);
      console.log("Child areas ya filtradas:", childAreas);
      const hasChildren = childAreas.length > 0;
      const isExpanded = expandedAreas.has(area.id);
      const isRootArea = true; // Siempre es ROOT en este nivel
      
      return (
        <div key={area.id} className="space-y-1">
          <div
            className={`flex items-center gap-3 p-4 rounded-lg transition-all cursor-pointer ${
              isRootArea
                ? 'bg-primary/5 border-l-4 border-primary hover:bg-primary/10' 
                : 'bg-secondary/30 hover:bg-secondary/50 border-l-2 border-muted ml-8'
            }`}
          >
            {/* Botón de expandir/colapsar solo para áreas con hijos */}
            {hasChildren && isRootArea ? (
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
              onClick={() => hasChildren && isRootArea && toggleArea(area.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`font-medium text-foreground ${
                    isRootArea ? 'text-base' : 'text-sm'
                  }`}>
                    {area.name}
                  </p>
                  <EntityBadge status={areaStatus} />
                  {isRootArea && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      Área Principal
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Nivel {visualLevel}
                  </span>
                  {hasChildren && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {childAreas.length} {childAreas.length === 1 ? 'subárea' : 'subáreas'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/areas/${area.id}`)}
                  className="gap-2 h-9"
                >
                  <Eye className="h-4 w-4" />
                  Ver Detalle
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(area)}
                  className="gap-2 h-9"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              </div>
            </div>
          </div>
          
          {/* Renderizar áreas hijas solo si está expandido */}
          {isExpanded && hasChildren && (
            <div className="space-y-1 ml-4">
              {childAreas.map((childArea: any) => {
                const childStatus = childArea.isActive ? 'ACTIVO' : 'INACTIVO';
                const childVisualLevel = (childArea.level || 1) + 1;
                
                return (
                  <div 
                    key={childArea.id}
                    className="flex items-center gap-3 p-4 rounded-lg transition-all bg-secondary/30 hover:bg-secondary/50 border-l-2 border-muted"
                  >
                    <div className="w-7" /> 
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground text-sm">
                          {childArea.name}
                        </p>
                        <EntityBadge status={childStatus} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Nivel {childVisualLevel}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/areas/${childArea.id}`)}
                        className="gap-2 h-9"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Detalle
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(childArea)}
                        className="gap-2 h-9"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Áreas</h1>
          <p className="text-muted-foreground">
            Gestiona la estructura jerárquica de áreas • {areas.length} {areas.length === 1 ? 'área' : 'áreas'}
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

            {/* Botón limpiar filtros */}
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

      <Card className="shadow-sm">
        <CardHeader>
          <h3 className="text-lg font-semibold text-foreground">Jerarquía de Áreas</h3>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Cargando áreas...</p>
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

      {/* Dialog para crear/editar área */}
      <AreaDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onSubmit={selectedArea ? handleEditArea : handleCreateArea}
        defaultValues={selectedArea || undefined}
        isLoading={actionLoading}
        mode={selectedArea ? "edit" : "create"}
      />
    </div>
  );
}
