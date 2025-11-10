"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, ChevronRight } from "lucide-react";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { Area } from "@/domain/entities/Area";
import { TENANT_ID } from "@/shared/constants";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";

export function AreasView() {
  const { areaRepo } = useRepositories();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    setLoading(true);
    const result = await areaRepo.findAll(TENANT_ID);
    setAreas(result);
    setLoading(false);
  };

  const getChildAreas = (parentId?: string) => {
    return areas.filter(a => a.parentId === parentId);
  };

  const renderAreaTree = (parentId?: string, level = 0) => {
    const children = getChildAreas(parentId);
    return children.map(area => (
      <div key={area.id} className="space-y-2">
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors`}
          style={{ marginLeft: `${level * 24}px` }}
        >
          {level > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <div className="flex-1">
            <p className="font-medium text-foreground">{area.name}</p>
            <p className="text-sm text-muted-foreground">Nivel {area.level}</p>
          </div>
          <EntityBadge status={area.status} />
        </div>
        {renderAreaTree(area.id, level + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Áreas</h1>
          <p className="text-muted-foreground">Estructura jerárquica de áreas</p>
        </div>
        <Button className="bg-primary text-primary-foreground h-10 gap-2">
          <Plus className="h-4 w-4" />
          Nueva Área
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <h3 className="text-lg font-semibold text-foreground">Jerarquía de Áreas</h3>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : areas.length === 0 ? (
            <EmptyState message="No se encontraron áreas" />
          ) : (
            <div className="space-y-2">{renderAreaTree()}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
