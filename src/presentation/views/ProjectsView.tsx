"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Project } from "@/domain/entities/Project";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";
import { CreateProjectDialog } from "@/presentation/components/CreateProjectDialog";
import { useProjects, projectKeys } from "@/hooks/useProjects";
import { ProjectQueryParams } from "@/domain/repositories/IProjectRepository";
import { GetProjectById } from "@/application/usecases/project/GetProjectById";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Helper: Parse query params from URL
 */
const parseQueryParams = (searchParams: URLSearchParams): ProjectQueryParams => {
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | undefined;

  return {
    page: page > 0 ? page : 1,
    limit: limit > 0 ? limit : 10,
    search,
    status,
    sortBy,
    sortOrder,
  };
};

/**
 * Helper: Build query params for URL
 */
const buildQueryParams = (params: ProjectQueryParams): URLSearchParams => {
  const query = new URLSearchParams();
  query.set("page", params.page.toString());
  if (params.limit) query.set("limit", params.limit.toString());
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  return query;
};

export function ProjectsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { projectRepo } = useRepositories();

  // ✅ Fuente de verdad: URL → filters derivado
  const filters = useMemo(() => parseQueryParams(searchParams), [searchParams]);

  // Estado del dialog de creación
  const [createOpen, setCreateOpen] = useState(false);

  // Local state solo para el input (debounce)
  const [searchInput, setSearchInput] = useState(filters.search ?? "");

  // ✅ Mantener input sincronizado si cambia la URL
  useEffect(() => {
    setSearchInput(filters.search ?? "");
  }, [filters.search]);

  // Fetch con React Query (depende de filters)
  const { data, isLoading, isError, error } = useProjects(filters);

  /**
   * Helper: aplica updates a filters y hace push a la URL
   */
  const pushFilters = useCallback(
    (updates: Partial<ProjectQueryParams>) => {
      const next: ProjectQueryParams = {
        ...filters,
        ...updates,
      };

      const qs = buildQueryParams(next);
      router.push(`?${qs.toString()}`);
    },
    [filters, router]
  );

  // ✅ Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      const nextSearch = trimmed ? trimmed : undefined;

      if (nextSearch !== filters.search) {
        pushFilters({ search: nextSearch, page: 1 });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, pushFilters]);

  const handleFilterChange = (key: keyof ProjectQueryParams, value: any) => {
    pushFilters({ [key]: value, page: 1 });
  };

  const goToPage = (page: number) => pushFilters({ page });

  const goToNextPage = () => {
    if (data?.hasNext) goToPage(filters.page + 1);
  };

  const goToPrevPage = () => {
    if (data?.hasPrev) goToPage(filters.page - 1);
  };

  const goToProjectDetail = (id: string) => {
    router.push(`/projects/${id}`);
  };

  const prefetchProject = useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: projectKeys.detail(id),
        queryFn: async () => {
          const useCase = new GetProjectById(projectRepo);
          const result = await useCase.execute(id);
          if (!result.ok) throw new Error(result.error);
          return result.value;
        },
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient, projectRepo]
  );

  const onRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToProjectDetail(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Proyectos</h1>
          <p className="text-muted-foreground">Gestión de proyectos y asignaciones</p>
        </div>
        <Button
          className="bg-primary text-primary-foreground h-10 gap-2"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 h-10 bg-secondary/30"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                handleFilterChange("status", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="ACTIVO">Activo</SelectItem>
                <SelectItem value="INACTIVO">Inactivo</SelectItem>
                <SelectItem value="FINALIZADO">Finalizado</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select
              value={filters.sortOrder || "desc"}
              onValueChange={(value) =>
                handleFilterChange("sortOrder", value as "asc" | "desc")
              }
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Más recientes</SelectItem>
                <SelectItem value="asc">Más antiguos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {/* Loading */}
          {isLoading && (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="p-6">
              <EmptyState message={error?.message || "Error al cargar proyectos"} />
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && data?.data.length === 0 && (
            <div className="p-6">
              <EmptyState message="No se encontraron proyectos" />
            </div>
          )}

          {/* Table */}
          {!isLoading && !isError && data && data.data.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                        Código
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                        Nombre
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                        Estado
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                        # Productos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((project: Project) => (
                      <tr
                        key={project.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => goToProjectDetail(project.id)}
                        onKeyDown={(e) => onRowKeyDown(e, project.id)}
                        onMouseEnter={() => prefetchProject(project.id)}
                        className="border-b border-border hover:bg-secondary/20 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <td className="py-4 px-4 font-mono text-sm text-foreground">
                          {project.code}
                        </td>
                        <td className="py-4 px-4 font-medium text-foreground">
                          {project.name}
                        </td>
                        <td className="py-4 px-4">
                          <EntityBadge status={project.status} />
                        </td>
                        <td className="py-4 px-4 text-right text-foreground">
                          {project.productsCount ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Mostrando{" "}
                  <span className="font-medium">
                    {(data.page - 1) * data.limit + 1}
                  </span>{" "}
                  a{" "}
                  <span className="font-medium">
                    {Math.min(data.page * data.limit, data.total)}
                  </span>{" "}
                  de <span className="font-medium">{data.total}</span> proyectos
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPage}
                    disabled={!data.hasPrev}
                    className="h-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>

                  <div className="text-sm text-muted-foreground">
                    Página <span className="font-medium">{data.page}</span> de{" "}
                    <span className="font-medium">{data.totalPages}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={!data.hasNext}
                    className="h-9"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Nuevo Proyecto */}
      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}