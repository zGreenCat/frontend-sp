"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package2, AlertTriangle, CheckCircle2, Wrench, Settings, Plus } from "lucide-react";
import { useMaterials, useEquipments, useSpareParts, useCreateProduct } from "@/hooks/useProducts";
import { Product, ProductKind } from "@/domain/entities/Product";
import { EmptyState } from "@/presentation/components/EmptyState";
import { CreateProductDialog } from "@/presentation/components/CreateProductDialog";
import { ProductFilterBar } from "@/presentation/components/ProductFilterBar";
import { CreateProductInput } from "@/shared/schemas";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { useCurrencies } from "@/hooks/useUnitsAndCurrencies";
import { useUnitsOfMeasure } from "@/hooks/useUnitsAndCurrencies";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  EquipmentQuery, 
  MaterialQuery, 
  SparePartQuery 
} from "@/shared/types/product-filters.types";
import { buildQueryParams, parseQueryParams } from "@/shared/utils/queryParamsHelper";

/**
 * Formatea una fecha de forma segura
 * Si la fecha es inválida, retorna un mensaje por defecto
 */
function formatDateSafe(dateString: string | undefined | null, formatStr: string = "dd/MM/yyyy"): string {
  if (!dateString) return "Fecha no disponible";
  
  try {
    const date = new Date(dateString);
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return "Fecha no disponible";
    }
    return format(date, formatStr, { locale: es });
  } catch (error) {
    console.error("[ProductsView] Error formatting date:", dateString, error);
    return "Fecha no disponible";
  }
}

export function ProductsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isAdmin, isManager } = usePermissions();
  
  // Cargar catálogos
  const { data: currencies = [] } = useCurrencies();
  const { data: unitsOfMeasure = [] } = useUnitsOfMeasure();
  
  // ✅ Leer tab desde URL query params (defaultTab=materials)
  const tabFromUrl = searchParams.get('tab') || 'materials';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  
  // Estado del diálogo de creación
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogKind, setCreateDialogKind] = useState<ProductKind>('MATERIAL');
  
  // ======== Estados para Materiales ========
  const [materialFilters, setMaterialFilters] = useState<MaterialQuery>(() => {
    const fromUrl = parseQueryParams(searchParams);
    return {
      page: fromUrl.page || 1,
      limit: 10,
      search: fromUrl.search || '',
      isActive: fromUrl.isActive,
      currencyId: fromUrl.currencyId,
      unitOfMeasureId: (fromUrl as any).unitOfMeasureId,
      isHazardous: (fromUrl as any).isHazardous,
    };
  });
  
  // ======== Estados para Equipos ========
  const [equipmentFilters, setEquipmentFilters] = useState<EquipmentQuery>(() => {
    const fromUrl = parseQueryParams(searchParams);
    return {
      page: fromUrl.page || 1,
      limit: 10,
      search: fromUrl.search || '',
      isActive: fromUrl.isActive,
      currencyId: fromUrl.currencyId,
    };
  });
  
  // ======== Estados para Repuestos ========
  const [sparePartFilters, setSparePartFilters] = useState<SparePartQuery>(() => {
    const fromUrl = parseQueryParams(searchParams);
    return {
      page: fromUrl.page || 1,
      limit: 10,
      search: fromUrl.search || '',
      isActive: fromUrl.isActive,
      currencyId: fromUrl.currencyId,
      category: (fromUrl as any).category,
      equipmentId: (fromUrl as any).equipmentId,
    };
  });

  // Hooks para datos
  const { data: materialsData, isLoading: loadingMaterials, error: errorMaterials } = useMaterials(materialFilters);
  const { data: equipmentsData, isLoading: loadingEquipments, error: errorEquipments } = useEquipments(equipmentFilters);
  const { data: sparePartsData, isLoading: loadingSpareParts, error: errorSpareParts } = useSpareParts(sparePartFilters);

  // Mutation para crear producto
  const createProductMutation = useCreateProduct();
  
  // ✅ Sincronizar URL con filtros actuales
  const syncUrlWithFilters = useCallback((filters: any, tab: string) => {
    const params = buildQueryParams(filters);
    params.set('tab', tab);
    router.replace(`/products?${params.toString()}`, { scroll: false });
  }, [router]);
  
  // Sincronizar cuando cambian los filtros del tab activo
  useEffect(() => {
    if (activeTab === 'materials') {
      syncUrlWithFilters(materialFilters, activeTab);
    } else if (activeTab === 'equipments') {
      syncUrlWithFilters(equipmentFilters, activeTab);
    } else if (activeTab === 'spare-parts') {
      syncUrlWithFilters(sparePartFilters, activeTab);
    }
  }, [materialFilters, equipmentFilters, sparePartFilters, activeTab, syncUrlWithFilters]);

  // Manejo de errores con toast
  useEffect(() => {
    if (errorMaterials && activeTab === "materials") {
      toast({
        variant: "destructive",
        title: "Error al cargar los productos",
        description: (errorMaterials as Error).message || "No se pudieron cargar los materiales",
      });
    }
  }, [errorMaterials, activeTab, toast]);

  useEffect(() => {
    if (errorEquipments && activeTab === "equipments") {
      toast({
        variant: "destructive",
        title: "Error al cargar los productos",
        description: (errorEquipments as Error).message || "No se pudieron cargar los equipos",
      });
    }
  }, [errorEquipments, activeTab, toast]);

  useEffect(() => {
    if (errorSpareParts && activeTab === "spare-parts") {
      toast({
        variant: "destructive",
        title: "Error al cargar los productos",
        description: (errorSpareParts as Error).message || "No se pudieron cargar los repuestos",
      });
    }
  }, [errorSpareParts, activeTab, toast]);

  const materials: Product[] = materialsData?.data || [];
  const totalMaterials = materialsData?.total || 0;
  const totalPagesMaterials = materialsData?.totalPages || 0;

  const equipments: Product[] = equipmentsData?.data || [];
  const totalEquipments = equipmentsData?.total || 0;
  const totalPagesEquipments = equipmentsData?.totalPages || 0;

  const spareParts: Product[] = sparePartsData?.data || [];
  const totalSpareParts = sparePartsData?.total || 0;
  const totalPagesSpareParts = sparePartsData?.totalPages || 0;

  // Permisos: puede crear productos si es Admin o Manager
  const canCreateProduct = isAdmin() || isManager();

  // Helper para convertir ProductKind a slug de URL
  const kindToSlug = (kind: ProductKind): string => {
    switch (kind) {
      case 'EQUIPMENT':
        return 'equipment';
      case 'MATERIAL':
        return 'material';
      case 'SPARE_PART':
        return 'spare-part';
    }
  };

  // Helper para convertir ProductKind a nombre de tab
  const kindToTab = (kind: ProductKind): string => {
    switch (kind) {
      case 'EQUIPMENT':
        return 'equipments';
      case 'MATERIAL':
        return 'materials';
      case 'SPARE_PART':
        return 'spare-parts';
      default:
        return 'materials';
    }
  };

  // ✅ Navegación al detalle con preservación del tab actual
  const handleNavigateToDetail = (productId: string, kind: ProductKind) => {
    const tab = kindToTab(kind);
    router.push(`/products/${kindToSlug(kind)}/${productId}?returnTab=${tab}`);
  };

  // Handler para abrir diálogo de crear producto
  const handleOpenCreateDialog = (kind: ProductKind) => {
    setCreateDialogKind(kind);
    setCreateDialogOpen(true);
  };

  // Handler para crear producto
  const handleCreateProduct = async (data: CreateProductInput) => {
    try {
      const product = await createProductMutation.mutateAsync(data);
      
      toast({
        title: "Producto creado correctamente",
        description: `${product.name} ha sido agregado al catálogo`,
      });
      
      setCreateDialogOpen(false);
      
      // Resetear paginación del tab correspondiente
      switch (product.kind) {
        case 'MATERIAL':
          setMaterialFilters(prev => ({ ...prev, page: 1 }));
          break;
        case 'EQUIPMENT':
          setEquipmentFilters(prev => ({ ...prev, page: 1 }));
          break;
        case 'SPARE_PART':
          setSparePartFilters(prev => ({ ...prev, page: 1 }));
          break;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al procesar la operación de producto",
        description: (error as Error).message || "No se pudo crear el producto",
      });
    }
  };
  
  // ✅ Handlers para actualizar filtros (resetean page a 1)
  const updateMaterialFilters = (updates: Partial<MaterialQuery>) => {
    setMaterialFilters(prev => ({
      ...prev,
      ...updates,
      // Resetear página cuando cambia cualquier filtro distinto de page
      page: ('page' in updates) ? updates.page! : 1,
    }));
  };
  
  const updateEquipmentFilters = (updates: Partial<EquipmentQuery>) => {
    setEquipmentFilters(prev => ({
      ...prev,
      ...updates,
      page: ('page' in updates) ? updates.page! : 1,
    }));
  };
  
  const updateSparePartFilters = (updates: Partial<SparePartQuery>) => {
    setSparePartFilters(prev => ({
      ...prev,
      ...updates,
      page: ('page' in updates) ? updates.page! : 1,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Productos</h1>
        <p className="text-muted-foreground mt-1">
          Catálogo de materiales, equipos y repuestos logísticos
        </p>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={(newTab) => {
        setActiveTab(newTab);
        // ✅ Actualizar URL con el tab activo
        router.push(`/products?tab=${newTab}`, { scroll: false });
      }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="materials">Materiales</TabsTrigger>
          <TabsTrigger value="equipments">Equipos</TabsTrigger>
          <TabsTrigger value="spare-parts">Repuestos</TabsTrigger>
        </TabsList>

        {/* Tab de Materiales */}
        <TabsContent value="materials" className="space-y-4">
          {/* Filtros */}
          <ProductFilterBar
            type="MATERIAL"
            search={materialFilters.search}
            onSearchChange={(search) => updateMaterialFilters({ search })}
            isActive={materialFilters.isActive}
            onIsActiveChange={(isActive) => updateMaterialFilters({ isActive })}
            currencyId={materialFilters.currencyId}
            onCurrencyIdChange={(currencyId) => updateMaterialFilters({ currencyId })}
            currencies={currencies}
            unitOfMeasureId={materialFilters.unitOfMeasureId}
            onUnitOfMeasureIdChange={(unitOfMeasureId) => updateMaterialFilters({ unitOfMeasureId })}
            unitsOfMeasure={unitsOfMeasure}
            isHazardous={materialFilters.isHazardous}
            onIsHazardousChange={(isHazardous) => updateMaterialFilters({ isHazardous })}
          />

          {/* Tabla de Materiales */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package2 className="h-5 w-5" />
                  Materiales ({totalMaterials})
                </CardTitle>
                {canCreateProduct && (
                  <Button 
                    onClick={() => handleOpenCreateDialog('MATERIAL')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Crear material
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingMaterials ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : materials.length === 0 ? (
                <EmptyState message="No se encontraron materiales" />
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Unidad</TableHead>
                          <TableHead className="text-center">Peligroso</TableHead>
                          <TableHead>Moneda</TableHead>
                          <TableHead>Costo unitario</TableHead>
                          <TableHead className="text-center">Categorías</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materials.map((material) => (
                          <TableRow 
                            key={material.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleNavigateToDetail(material.id, 'MATERIAL')}
                          >
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {material.sku || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{material.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {material.id.substring(0, 8)}...
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground max-w-xs truncate">
                                {material.description || "—"}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {material.unitOfMeasure || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {material.isHazardous ? (
                                <div className="flex items-center justify-center gap-1">
                                  <AlertTriangle className="h-4 w-4 text-destructive" />
                                  <span className="text-sm font-medium text-destructive">
                                    Sí
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    No
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="font-mono">
                                {material.currency || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {material.price !== undefined && material.price !== null ? (
                                <p className="text-sm font-medium">
                                  {material.currencySymbol || material.currency || ''} {material.price.toLocaleString('es-CL')}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground">—</p>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {material.categories && material.categories.length > 0 ? (
                                <Badge variant="secondary">
                                  {material.categories.map((cat: any) => cat.name || cat).join(', ')}
                                </Badge>
                              ) : (
                                <span className="text-sm text-muted-foreground">Sin categoría</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={material.isActive ? "default" : "secondary"}
                                className={
                                  material.isActive
                                    ? "bg-green-100 text-green-800 border-green-300"
                                    : "bg-gray-100 text-gray-800 border-gray-300"
                                }
                              >
                                {material.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginación */}
                  {totalPagesMaterials > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateMaterialFilters({ page: materialFilters.page! - 1 })}
                        disabled={materialFilters.page === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {materialFilters.page} de {totalPagesMaterials}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateMaterialFilters({ page: materialFilters.page! + 1 })}
                        disabled={materialFilters.page === totalPagesMaterials}
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

        {/* Tab de Equipos */}
        <TabsContent value="equipments" className="space-y-4">
          {/* Filtros */}
          <ProductFilterBar
            type="EQUIPMENT"
            search={equipmentFilters.search}
            onSearchChange={(search) => updateEquipmentFilters({ search })}
            isActive={equipmentFilters.isActive}
            onIsActiveChange={(isActive) => updateEquipmentFilters({ isActive })}
            currencyId={equipmentFilters.currencyId}
            onCurrencyIdChange={(currencyId) => updateEquipmentFilters({ currencyId })}
            currencies={currencies}
          />

          {/* Tabla de Equipos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Equipos ({totalEquipments})
                </CardTitle>
                {canCreateProduct && (
                  <Button 
                    onClick={() => handleOpenCreateDialog('EQUIPMENT')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Crear equipo
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingEquipments ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : equipments.length === 0 ? (
                <EmptyState message="No se encontraron equipos" />
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Modelo</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Moneda</TableHead>
                          <TableHead>Costo unitario</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Creado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {equipments.map((equipment) => (
                          <TableRow 
                            key={equipment.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleNavigateToDetail(equipment.id, 'EQUIPMENT')}
                          >
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {equipment.sku || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{equipment.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {equipment.id.substring(0, 8)}...
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {equipment.model}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground max-w-xs truncate">
                                {equipment.description || "—"}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="font-mono">
                                {equipment.currency || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {equipment.price !== undefined && equipment.price !== null ? (
                                <p className="text-sm font-medium">
                                  {equipment.currencySymbol || equipment.currency || ''} {equipment.price.toLocaleString('es-CL')}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground">—</p>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={equipment.isActive ? "default" : "secondary"}
                                className={
                                  equipment.isActive
                                    ? "bg-green-100 text-green-800 border-green-300"
                                    : "bg-gray-100 text-gray-800 border-gray-300"
                                }
                              >
                                {equipment.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground">
                                {formatDateSafe(equipment.createdAt)}
                              </p>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginación */}
                  {totalPagesEquipments > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateEquipmentFilters({ page: equipmentFilters.page! - 1 })}
                        disabled={equipmentFilters.page === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {equipmentFilters.page} de {totalPagesEquipments}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateEquipmentFilters({ page: equipmentFilters.page! + 1 })}
                        disabled={equipmentFilters.page === totalPagesEquipments}
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

        {/* Tab de Repuestos */}
        <TabsContent value="spare-parts" className="space-y-4">
          {/* Filtros */}
          <ProductFilterBar
            type="SPARE_PART"
            search={sparePartFilters.search}
            onSearchChange={(search) => updateSparePartFilters({ search })}
            isActive={sparePartFilters.isActive}
            onIsActiveChange={(isActive) => updateSparePartFilters({ isActive })}
            currencyId={sparePartFilters.currencyId}
            onCurrencyIdChange={(currencyId) => updateSparePartFilters({ currencyId })}
            currencies={currencies}
            category={sparePartFilters.category}
            onCategoryChange={(category) => updateSparePartFilters({ category })}
            equipmentId={sparePartFilters.equipmentId}
            onEquipmentIdChange={(equipmentId) => updateSparePartFilters({ equipmentId })}
            equipments={equipments.map(e => ({ id: e.id, name: e.name }))}
          />

          {/* Tabla de Repuestos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Repuestos ({totalSpareParts})
                </CardTitle>
                {canCreateProduct && (
                  <Button 
                    onClick={() => handleOpenCreateDialog('SPARE_PART')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Crear repuesto
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingSpareParts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : spareParts.length === 0 ? (
                <EmptyState message="No se encontraron repuestos" />
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Moneda</TableHead>
                          <TableHead>Costo unitario</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Creado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {spareParts.map((sparePart) => (
                          <TableRow 
                            key={sparePart.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleNavigateToDetail(sparePart.id, 'SPARE_PART')}
                          >
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {sparePart.sku || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{sparePart.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {sparePart.id.substring(0, 8)}...
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground max-w-xs truncate">
                                {sparePart.description || "—"}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="font-mono">
                                {sparePart.currency || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {sparePart.price !== undefined && sparePart.price !== null ? (
                                <p className="text-sm font-medium">
                                  {sparePart.currencySymbol || sparePart.currency || ''} {sparePart.price.toLocaleString('es-CL')}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground">—</p>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={sparePart.isActive ? "default" : "secondary"}
                                className={
                                  sparePart.isActive
                                    ? "bg-green-100 text-green-800 border-green-300"
                                    : "bg-gray-100 text-gray-800 border-gray-300"
                                }
                              >
                                {sparePart.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground">
                                {formatDateSafe(sparePart.createdAt)}
                              </p>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginación */}
                  {totalPagesSpareParts > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSparePartFilters({ page: sparePartFilters.page! - 1 })}
                        disabled={sparePartFilters.page === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {sparePartFilters.page} de {totalPagesSpareParts}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSparePartFilters({ page: sparePartFilters.page! + 1 })}
                        disabled={sparePartFilters.page === totalPagesSpareParts}
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

      {/* Diálogo de creación de producto */}
      <CreateProductDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        kind={createDialogKind}
        onSubmit={handleCreateProduct}
        isLoading={createProductMutation.isPending}
      />
    </div>
  );
}
