"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Upload } from "lucide-react";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { Product } from "@/domain/entities/Product";
import { TENANT_ID } from "@/shared/constants";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

export function ProductsView() {
  const { productRepo } = useRepositories();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const result = await productRepo.findAll(TENANT_ID);
    setProducts(result);
    setLoading(false);
  };

  const handleImport = () => {
    toast({
      title: "Importar Excel",
      description: "Funcionalidad de importación no implementada (demo)",
    });
  };

  const filteredProducts = products.filter(p =>
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Productos</h1>
          <p className="text-muted-foreground">Catálogo de equipos, materiales y repuestos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport} className="h-10 gap-2">
            <Upload className="h-4 w-4" />
            Importar Excel
          </Button>
          <Button className="bg-primary text-primary-foreground h-10 gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por SKU o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-secondary/30"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState message="No se encontraron productos" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">SKU</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Descripción</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Tipo</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Estado</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Costo Unitario</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-4 font-mono text-sm text-foreground">{product.sku}</td>
                      <td className="py-4 px-4 text-foreground">{product.description}</td>
                      <td className="py-4 px-4">
                        <EntityBadge status={product.type} />
                      </td>
                      <td className="py-4 px-4">
                        <EntityBadge status={product.status} />
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-foreground">
                        {product.unitCost
                          ? `${product.currency} $${product.unitCost.toLocaleString()}`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
