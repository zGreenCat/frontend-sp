"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { Project } from "@/domain/entities/Project";
import { TENANT_ID } from "@/shared/constants";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";

export function ProjectsView() {
  const { projectRepo } = useRepositories();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const loadProjects = async () => {
      setLoading(true);
      const result = await projectRepo.findAll(TENANT_ID);
      setProjects(result);
      setLoading(false);
    };

    loadProjects();
  }, [projectRepo]);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Proyectos</h1>
          <p className="text-muted-foreground">Gestión de proyectos y asignaciones</p>
        </div>
        <Button className="bg-primary text-primary-foreground h-10 gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Proyecto
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proyecto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-secondary/30"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : filteredProjects.length === 0 ? (
            <EmptyState message="No se encontraron proyectos" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Código</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Nombre</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Estado</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground"># Productos</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-4 font-mono text-sm text-foreground">{project.code}</td>
                      <td className="py-4 px-4 font-medium text-foreground">{project.name}</td>
                      <td className="py-4 px-4">
                        <EntityBadge status={project.status} />
                      </td>
                      <td className="py-4 px-4 text-right text-foreground">{project.productsCount}</td>
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
