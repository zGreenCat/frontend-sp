"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye } from "lucide-react";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { Box } from "@/domain/entities/Box";
import { TENANT_ID } from "@/shared/constants";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";

export function BoxesView() {
  const { boxRepo } = useRepositories();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoxes();
  }, []);

  const loadBoxes = async () => {
    setLoading(true);
    const result = await boxRepo.findAll(TENANT_ID);
    setBoxes(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Cajas</h1>
          <p className="text-muted-foreground">Gestión de contenedores y embalajes</p>
        </div>
        <Button className="bg-primary text-primary-foreground h-10 gap-2">
          <Plus className="h-4 w-4" />
          Nueva Caja
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando...</div>
      ) : boxes.length === 0 ? (
        <EmptyState message="No se encontraron cajas" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boxes.map((box) => (
            <Card key={box.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-base font-mono">
                    {box.code}
                  </Badge>
                  <EntityBadge status={box.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tipo</p>
                  <p className="font-medium text-foreground">{box.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Costo Unitario</p>
                  <p className="text-lg font-bold text-primary">
                    {box.currency} ${box.unitCost.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Historial</p>
                  <p className="text-sm text-foreground">{box.history.length} evento(s)</p>
                </div>
                <Button variant="outline" className="w-full h-9 gap-2">
                  <Eye className="h-4 w-4" />
                  Ver Detalle
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
