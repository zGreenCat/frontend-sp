"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Loader2,
  Edit,
  Trash2,
  Package,
  Info,
  GitBranch,
  History,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { useProductDetail, useUpdateProduct, useProductHistory } from "@/hooks/useProducts";
import { ProductKind, Product } from "@/domain/entities/Product";
import { ProductHistoryFilters } from "@/domain/entities/ProductHistory";
import { UpdateProductInput } from "@/shared/schemas";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { EmptyState } from "@/presentation/components/EmptyState";
import { EditProductDialog } from "@/presentation/components/EditProductDialog";
import { ProductHistoryTable } from "@/presentation/components/ProductHistoryTable";

interface ProductDetailViewProps {
  productId: string;
  kind: ProductKind;
}

/**
 * Mapea ProductKind a nombre legible
 */
function getProductKindLabel(kind: ProductKind): string {
  switch (kind) {
    case 'EQUIPMENT':
      return 'Equipo';
    case 'MATERIAL':
      return 'Material';
    case 'SPARE_PART':
      return 'Repuesto';
    default:
      return 'Producto';
  }
}

/**
 * Mapea ProductKind a ruta de listado
 */
function getProductListRoute(kind: ProductKind): string {
  // Por ahora redirigimos a /products
  // Si en el futuro hay rutas específicas por tipo, ajustar aquí
  return '/products';
}

export function ProductDetailView({ productId, kind }: ProductDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { can, isAdmin, isManager } = usePermissions();

  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useProductDetail(productId, kind);

  const updateProductMutation = useUpdateProduct();

  const [activeTab, setActiveTab] = useState("general");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  // Estado para historial
  const [historyPage, setHistoryPage] = useState(1);
  const [historyFilters, setHistoryFilters] = useState<ProductHistoryFilters>({
    page: 1,
    limit: 10,
  });

  // Query de historial
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useProductHistory(productId, kind, historyFilters);

  // Permisos para editar/eliminar
  const canEdit = isAdmin() || isManager();

  // Manejar errores
  if (error) {
    const errorMessage = (error as Error).message;
    
    if (errorMessage === 'NOT_FOUND') {
      toast({
        title: "Producto no encontrado",
        description: "El producto que buscas no existe o fue eliminado.",
        variant: "destructive",
      });
      
      return (
        <div className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(getProductListRoute(kind))}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Productos
          </Button>
          <EmptyState message="Producto no encontrado" />
        </div>
      );
    }

    // Otros errores
    toast({
      title: "Error al cargar el producto",
      description: "Ocurrió un error al cargar el detalle del producto.",
      variant: "destructive",
    });

    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(getProductListRoute(kind))}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Productos
        </Button>
        <EmptyState message="Error al cargar el producto" />
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Cargando detalles del producto...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(getProductListRoute(kind))}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Productos
        </Button>
        <EmptyState message="Producto no encontrado" />
      </div>
    );
  }

  const kindLabel = getProductKindLabel(kind);

  // Handler para editar producto
  const handleEditProduct = async (input: UpdateProductInput) => {
    if (!product) return;
    
    // Validación de permisos adicional
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Permiso denegado",
        description: "No tienes permisos para editar productos.",
      });
      return;
    }

    try {
      await updateProductMutation.mutateAsync({
        id: productId,
        kind,
        input,
      });

      toast({
        title: "Producto actualizado correctamente",
        description: `${product.name} ha sido actualizado exitosamente.`,
      });

      setEditDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al procesar la operación de producto",
        description: (error as Error).message,
      });
    }
  };

  // Handler para dar de baja (cambiar isActive a false)
  const handleDeactivateProduct = async () => {
    if (!product) return;
    
    // Validación de permisos adicional
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Permiso denegado",
        description: "No tienes permisos para dar de baja productos.",
      });
      return;
    }

    try {
      await updateProductMutation.mutateAsync({
        id: productId,
        kind,
        input: {
          id: productId,
          isActive: false,
        },
      });

      toast({
        title: "Producto dado de baja correctamente",
        description: `${product.name} ha sido desactivado.`,
      });

      setDeactivateDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al procesar la operación de producto",
        description: (error as Error).message,
      });
    }
  };

  // Handler para cambiar página del historial
  const handleHistoryPageChange = (newPage: number) => {
    setHistoryPage(newPage);
    setHistoryFilters({
      ...historyFilters,
      page: newPage,
    });
  };

  // Handler para exportar CSV (opcional, preparado para futuro)
  const handleExportHistoryCsv = () => {
    // TODO: Implementar exportación a CSV
    toast({
      title: "Función en desarrollo",
      description: "La exportación a CSV estará disponible próximamente.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header con breadcrumbs y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(getProductListRoute(kind))}
            className="gap-2 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Productos
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
            <Badge variant={product.isActive ? "default" : "secondary"}>
              {product.isActive ? "Activo" : "Inactivo"}
            </Badge>
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                  className="gap-2"
                  disabled={updateProductMutation.isPending}
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeactivateDialogOpen(true)}
                  className="gap-2"
                  disabled={updateProductMutation.isPending || !product.isActive}
                >
                  <Trash2 className="h-4 w-4" />
                  Dar de baja
                </Button>
              </>
            )}
          </div>
          <p className="text-muted-foreground">{kindLabel}</p>
        </div>
      </div>

      {/* Card de información maestra (siempre visible) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Información Maestra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ID</p>
              <p className="font-mono text-xs break-all">{product.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{kindLabel}</p>
            </div>
            
            {/* Modelo (solo para equipos) */}
            {kind === 'EQUIPMENT' && (
              <div>
                <p className="text-sm text-muted-foreground">Modelo</p>
                <p className="font-medium">{product.model || "-"}</p>
              </div>
            )}

            {/* Unidad de medida (solo para materiales) */}
            {kind === 'MATERIAL' && (
              <div>
                <p className="text-sm text-muted-foreground">Unidad de Medida</p>
                <p className="font-medium">{product.unitOfMeasure || "-"}</p>
              </div>
            )}

            {/* Peligrosidad (solo para materiales) */}
            {kind === 'MATERIAL' && (
              <div>
                <p className="text-sm text-muted-foreground">Peligrosidad</p>
                <div className="flex items-center gap-2">
                  {product.isHazardous ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="font-medium text-orange-500">Peligroso</span>
                    </>
                  ) : (
                    <span className="font-medium text-muted-foreground">No peligroso</span>
                  )}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Moneda</p>
              <p className="font-medium">{product.currency || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Costo</p>
              <p className="font-medium text-muted-foreground">Pendiente de formato</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Creación</p>
              <p className="font-medium">
                {format(new Date(product.createdAt), "dd MMM yyyy", { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Actualización</p>
              <p className="font-medium">
                {format(new Date(product.updatedAt), "dd MMM yyyy", { locale: es })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="gap-2">
            <Info className="h-4 w-4" />
            Información General
          </TabsTrigger>
          <TabsTrigger value="associations" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Asociaciones
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Tab: Información General */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Descripción y Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Descripción</p>
                <p className="text-sm">{product.description || "Sin descripción disponible."}</p>
              </div>

              {/* Categorías de materiales */}
              {kind === 'MATERIAL' && product.categories && product.categories.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Categorías</p>
                  <div className="flex flex-wrap gap-2">
                    {product.categories.map((categoryId) => (
                      <Badge key={categoryId} variant="outline">
                        {categoryId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Asociaciones */}
        <TabsContent value="associations">
          <Card>
            <CardHeader>
              <CardTitle>Asociaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Proveedor asociado */}
              <div>
                <p className="text-sm font-medium mb-2">Proveedor asociado</p>
                <EmptyState message="Sin proveedor asociado" />
              </div>

              {/* Proyectos asociados */}
              <div>
                <p className="text-sm font-medium mb-2">Proyectos asociados</p>
                <EmptyState message="No hay proyectos asociados todavía" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Cambios</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Loading */}
              {isLoadingHistory && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Cargando historial...
                    </p>
                  </div>
                </div>
              )}

              {/* Error: Backend no implementado */}
              {historyError && (historyError as Error).message === 'PRODUCT_HISTORY_NOT_IMPLEMENTED' && (
                <div className="py-12 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <History className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Historial no disponible</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      El módulo de historial de productos está en desarrollo.
                      Esta funcionalidad estará disponible próximamente cuando el backend
                      exponga los endpoints necesarios.
                    </p>
                  </div>
                  <div className="bg-muted/50 border border-border rounded-md p-4 max-w-md mx-auto">
                    <p className="text-xs text-muted-foreground">
                      <strong>Nota técnica:</strong> Los endpoints esperados son:
                      <br />
                      <code className="text-xs">GET /equipment/:id/history</code>
                      <br />
                      <code className="text-xs">GET /materials/:id/history</code>
                      <br />
                      <code className="text-xs">GET /spare-parts/:id/history</code>
                    </p>
                  </div>
                </div>
              )}

              {/* Otros errores */}
              {historyError && (historyError as Error).message !== 'PRODUCT_HISTORY_NOT_IMPLEMENTED' && (
                <div className="py-8">
                  <EmptyState message="Error al cargar historial del producto" />
                </div>
              )}

              {/* Sin errores: Mostrar datos */}
              {!historyError && !isLoadingHistory && historyData && (
                <ProductHistoryTable
                  events={historyData.data}
                  page={historyData.page}
                  limit={historyData.limit}
                  total={historyData.total}
                  totalPages={historyData.totalPages || 0}
                  onPageChange={handleHistoryPageChange}
                  onExportCsv={handleExportHistoryCsv}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para editar producto */}
      {product && (
        <EditProductDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          product={product}
          onSubmit={handleEditProduct}
          isLoading={updateProductMutation.isPending}
        />
      )}

      {/* AlertDialog para confirmar dar de baja */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de dar de baja este producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Si el producto está asociado a cajas o movimientos de inventario, puede impactar
              en la operación. El producto quedará como "Inactivo" y no podrá ser utilizado
              en nuevas operaciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateProductMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateProduct}
              disabled={updateProductMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {updateProductMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
