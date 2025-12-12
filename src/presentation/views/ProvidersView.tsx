"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { Provider } from "@/domain/entities/Provider";
import { TENANT_ID } from "@/shared/constants";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";

export function ProvidersView() {
  const { providerRepo } = useRepositories();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const loadProviders = async () => {
      setLoading(true);
      const result = await providerRepo.findAll(TENANT_ID);
      setProviders(result);
      setLoading(false);
    };

    loadProviders();
  }, [providerRepo]);

  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Proveedores</h1>
          <p className="text-muted-foreground">Gestión de proveedores de productos</p>
        </div>
        <Button className="bg-primary text-primary-foreground h-10 gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-secondary/30"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : filteredProviders.length === 0 ? (
            <EmptyState message="No se encontraron proveedores" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Nombre</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Estado</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground"># Productos</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviders.map((provider) => (
                    <tr key={provider.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-4 font-medium text-foreground">{provider.name}</td>
                      <td className="py-4 px-4">
                        <EntityBadge status={provider.status} />
                      </td>
                      <td className="py-4 px-4 text-right text-foreground">{provider.productsCount}</td>
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
