"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Search, Loader2, Package2, AlertTriangle, CheckCircle2, Wrench, Settings } from "lucide-react";
import { useMaterials, useEquipments, useSpareParts } from "@/hooks/useProducts";
import { Product } from "@/domain/entities/Product";
import { EmptyState } from "@/presentation/components/EmptyState";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function ProductsView() {
  const [activeTab, setActiveTab] = useState("materials");
  
  // Estados para tab de Materiales
  const [searchMaterials, setSearchMaterials] = useState("");
  const [pageMaterials, setPageMaterials] = useState(1);
  
  // Estados para tab de Equipos
  const [searchEquipments, setSearchEquipments] = useState("");
  const [pageEquipments, setPageEquipments] = useState(1);
  
  // Estados para tab de Repuestos
  const [searchSpareParts, setSearchSpareParts] = useState("");
  const [pageSpareParts, setPageSpareParts] = useState(1);
  
  const limit = 10;

  // Hooks para datos
  const { data: materialsData, isLoading: loadingMaterials } = useMaterials({
    page: pageMaterials,
    limit,
    search: searchMaterials || undefined,
  });

  const { data: equipmentsData, isLoading: loadingEquipments } = useEquipments({
    page: pageEquipments,
    limit,
    search: searchEquipments || undefined,
  });

  const { data: sparePartsData, isLoading: loadingSpareParts } = useSpareParts({
    page: pageSpareParts,
    limit,
    search: searchSpareParts || undefined,
  });

  const materials: Product[] = materialsData?.data || [];
  const totalMaterials = materialsData?.total || 0;
  const totalPagesMaterials = materialsData?.totalPages || 0;

  const equipments: Product[] = equipmentsData?.data || [];
  const totalEquipments = equipmentsData?.total || 0;
  const totalPagesEquipments = equipmentsData?.totalPages || 0;

  const spareParts: Product[] = sparePartsData?.data || [];
  const totalSpareParts = sparePartsData?.total || 0;
  const totalPagesSpareParts = sparePartsData?.totalPages || 0;

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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="materials">Materiales</TabsTrigger>
          <TabsTrigger value="equipments">Equipos</TabsTrigger>
          <TabsTrigger value="spare-parts">Repuestos</TabsTrigger>
        </TabsList>

        {/* Tab de Materiales */}
        <TabsContent value="materials" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Filtros de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                {/* Búsqueda */}
                <Input
                  placeholder="Buscar por nombre o descripción..."
                  value={searchMaterials}
                  onChange={(e) => {
                    setSearchMaterials(e.target.value);
                    setPageMaterials(1);
                  }}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Materiales */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package2 className="h-5 w-5" />
                  Materiales ({totalMaterials})
                </CardTitle>
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
                          <TableHead>Nombre</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Unidad</TableHead>
                          <TableHead className="text-center">Peligroso</TableHead>
                          <TableHead>Moneda</TableHead>
                          <TableHead className="text-center">Categorías</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materials.map((material) => (
                          <TableRow key={material.id}>
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
                                {material.unitOfMeasure}
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
                              <div className="text-sm">
                                <p className="font-medium">{material.currency || "—"}</p>
                                <p className="text-xs text-muted-foreground">
                                  Valor pendiente
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">
                                {material.categories?.length || 0}
                              </Badge>
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
                        onClick={() => setPageMaterials(pageMaterials - 1)}
                        disabled={pageMaterials === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {pageMaterials} de {totalPagesMaterials}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageMaterials(pageMaterials + 1)}
                        disabled={pageMaterials === totalPagesMaterials}
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Filtros de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <Input
                  placeholder="Buscar por nombre, modelo o descripción..."
                  value={searchEquipments}
                  onChange={(e) => {
                    setSearchEquipments(e.target.value);
                    setPageEquipments(1);
                  }}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Equipos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Equipos ({totalEquipments})
                </CardTitle>
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
                          <TableHead>Nombre</TableHead>
                          <TableHead>Modelo</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Moneda</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Creado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {equipments.map((equipment) => (
                          <TableRow key={equipment.id}>
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
                              <div className="text-sm">
                                <p className="font-medium">{equipment.currency || "—"}</p>
                                <p className="text-xs text-muted-foreground">
                                  Valor pendiente
                                </p>
                              </div>
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
                                {format(new Date(equipment.createdAt), "dd/MM/yyyy", { locale: es })}
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
                        onClick={() => setPageEquipments(pageEquipments - 1)}
                        disabled={pageEquipments === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {pageEquipments} de {totalPagesEquipments}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageEquipments(pageEquipments + 1)}
                        disabled={pageEquipments === totalPagesEquipments}
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Filtros de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <Input
                  placeholder="Buscar por nombre, modelo o descripción..."
                  value={searchSpareParts}
                  onChange={(e) => {
                    setSearchSpareParts(e.target.value);
                    setPageSpareParts(1);
                  }}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Repuestos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Repuestos ({totalSpareParts})
                </CardTitle>
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
                          <TableHead>Nombre</TableHead>
                          <TableHead>Modelo</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Moneda</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Creado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {spareParts.map((sparePart) => (
                          <TableRow key={sparePart.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{sparePart.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {sparePart.id.substring(0, 8)}...
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {sparePart.model || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground max-w-xs truncate">
                                {sparePart.description || "—"}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="font-medium">{sparePart.currency || "—"}</p>
                                <p className="text-xs text-muted-foreground">
                                  Valor pendiente
                                </p>
                              </div>
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
                                {format(new Date(sparePart.createdAt), "dd/MM/yyyy", { locale: es })}
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
                        onClick={() => setPageSpareParts(pageSpareParts - 1)}
                        disabled={pageSpareParts === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {pageSpareParts} de {totalPagesSpareParts}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageSpareParts(pageSpareParts + 1)}
                        disabled={pageSpareParts === totalPagesSpareParts}
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
    </div>
  );
}
