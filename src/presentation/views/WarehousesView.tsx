"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { Warehouse } from "@/domain/entities/Warehouse";
import { TENANT_ID } from "@/shared/constants";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";

export function WarehousesView() {
  const { warehouseRepo, areaRepo, userRepo } = useRepositories();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    setLoading(true);
    const result = await warehouseRepo.findAll(TENANT_ID);
    setWarehouses(result);
    setLoading(false);
  };

  const filteredWarehouses = warehouses.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Bodegas</h1>
          <p className="text-muted-foreground">Gestión de almacenes y capacidades</p>
        </div>
        <Button className="bg-primary text-primary-foreground h-10 gap-2">
          <Plus className="h-4 w-4" />
          Nueva Bodega
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar bodega..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-secondary/30"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : filteredWarehouses.length === 0 ? (
            <EmptyState message="No se encontraron bodegas" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Nombre</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Capacidad (Kg)</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Área</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWarehouses.map((warehouse) => (
                    <tr key={warehouse.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-4 font-medium text-foreground">{warehouse.name}</td>
                      <td className="py-4 px-4 text-foreground">{warehouse.capacityKg.toLocaleString()}</td>
                      <td className="py-4 px-4">
                        <EntityBadge status={warehouse.status} />
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {warehouse.areaId ? `Área ${warehouse.areaId}` : 'Sin asignar'}
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
