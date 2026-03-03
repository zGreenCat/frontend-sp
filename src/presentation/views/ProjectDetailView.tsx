"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Hash, Tag, Power, PowerOff, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";
import { ChangeProjectStatusDialog } from "@/presentation/components/ChangeProjectStatusDialog";
import { ProjectProductsTab } from "@/presentation/components/ProjectProductsTab";
import { useProject } from "@/hooks/useProjects";
import { ProjectStatus } from "@/domain/entities/Project";

interface ProjectDetailViewProps {
  projectId: string;
}

export function ProjectDetailView({ projectId }: ProjectDetailViewProps) {
  const router = useRouter();
  const { data: project, isLoading, isError, error } = useProject(projectId);
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    targetStatus: ProjectStatus | null;
  }>({ open: false, targetStatus: null });

  const openStatusDialog = (targetStatus: ProjectStatus) =>
    setStatusDialog({ open: true, targetStatus });

  const closeStatusDialog = (open: boolean) =>
    setStatusDialog((prev) => ({ open, targetStatus: prev.targetStatus }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-24" />
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-36" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 -ml-1">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <EmptyState message={error?.message || "No se pudo cargar el proyecto"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2 -ml-1 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Proyectos
      </Button>

      {/* Header card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                {project.name}
              </CardTitle>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {project.code}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              {/* Badge de estado */}
              <EntityBadge status={project.status} />

              {/* Botones de acción de estado */}
              {project.status === "ACTIVO" && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/20"
                    onClick={() => openStatusDialog("INACTIVO")}
                  >
                    <PowerOff className="h-4 w-4" />
                    Deshabilitar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
                    onClick={() => openStatusDialog("FINALIZADO")}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Finalizar
                  </Button>
                </div>
              )}

              {project.status === "INACTIVO" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/20"
                  onClick={() => openStatusDialog("ACTIVO")}
                >
                  <Power className="h-4 w-4" />
                  Reactivar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Detail tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="products">
            Productos
            {project.productsCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-xs">
                {project.productsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Información ─────────────────────────────────────────────────── */}
        <TabsContent value="info">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                {/* Código */}
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Código
                    </dt>
                    <dd className="mt-0.5 font-mono text-sm font-medium text-foreground">
                      {project.code}
                    </dd>
                  </div>
                </div>

                {/* Estado */}
                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Estado
                    </dt>
                    <dd className="mt-1">
                      <EntityBadge status={project.status} />
                    </dd>
                  </div>
                </div>

                {/* Productos */}
                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Productos asignados
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium text-foreground">
                      {project.productsCount ?? 0}
                    </dd>
                  </div>
                </div>

                {/* Creado el */}
                {project.createdAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Creado el
                      </dt>
                      <dd className="mt-0.5 text-sm text-foreground">
                        {new Date(project.createdAt).toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </dd>
                    </div>
                  </div>
                )}

                {/* Actualizado el */}
                {project.updatedAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Última actualización
                      </dt>
                      <dd className="mt-0.5 text-sm text-foreground">
                        {new Date(project.updatedAt).toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </dd>
                    </div>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Productos ────────────────────────────────────────────────────── */}
        <TabsContent value="products">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <ProjectProductsTab
                projectId={projectId}
                projectStatus={project.status}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de cambio de estado */}
      {statusDialog.targetStatus && (
        <ChangeProjectStatusDialog
          open={statusDialog.open}
          onOpenChange={closeStatusDialog}
          projectId={projectId}
          projectName={project.name}
          currentStatus={project.status}
          targetStatus={statusDialog.targetStatus}
        />
      )}
    </div>
  );
}

