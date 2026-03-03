"use client";

import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, AlertTriangle, Package } from "lucide-react";
import { ProjectStatus } from "@/domain/entities/Project";
import { CheckProductsResult } from "@/domain/repositories/IProjectRepository";
import { useCheckProjectProducts, useUpdateProjectStatus } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";

interface ChangeProjectStatusDialogProps {
  projectId: string;
  projectName: string;
  currentStatus: ProjectStatus;
  targetStatus: ProjectStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  FINALIZADO: "Finalizado",
};

export function ChangeProjectStatusDialog({
  projectId,
  projectName,
  currentStatus,
  targetStatus,
  open,
  onOpenChange,
}: ChangeProjectStatusDialogProps) {
  const { toast } = useToast();
  const checkMutation = useCheckProjectProducts();
  const updateStatusMutation = useUpdateProjectStatus();

  const [checkResult, setCheckResult] = useState<CheckProductsResult | null>(null);

  const needsCheck = targetStatus === "INACTIVO" || targetStatus === "FINALIZADO";

  // Disparar check-products cuando el dialog se abre
  useEffect(() => {
    if (!open) {
      // Reset al cerrar
      setCheckResult(null);
      checkMutation.reset();
      return;
    }

    if (needsCheck) {
      checkMutation.mutate(projectId, {
        onSuccess: (data) => setCheckResult(data),
        onError: () => setCheckResult(null),
      });
    }
    // Solo cuando open o targetStatus cambian
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId, targetStatus]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onOpenChange(false);
    }
  };

  const handleConfirm = async () => {
    try {
      await updateStatusMutation.mutateAsync({ id: projectId, status: targetStatus });

      toast({
        title: "✅ Estado actualizado",
        description: `"${projectName}" ahora está ${STATUS_LABELS[targetStatus]}.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "❌ Error al actualizar estado",
        description: error?.message || "No se pudo actualizar el estado. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const isLoadingCheck = needsCheck && checkMutation.isPending;
  const isConfirming = updateStatusMutation.isPending;

  const hasProducts = checkResult?.hasProducts ?? false;
  const totals = checkResult?.totals;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {hasProducts && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            Cambiar estado a {STATUS_LABELS[targetStatus]}
          </AlertDialogTitle>

          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Estás a punto de cambiar el estado de{" "}
                <span className="font-semibold text-foreground">"{projectName}"</span>{" "}
                de{" "}
                <span className="font-medium">{STATUS_LABELS[currentStatus]}</span>{" "}
                a{" "}
                <span className="font-medium">{STATUS_LABELS[targetStatus]}</span>.
              </p>

              {/* Loading del check */}
              {isLoadingCheck && (
                <div className="space-y-2 rounded-md border p-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-40" />
                </div>
              )}

              {/* Resumen de productos si hay */}
              {!isLoadingCheck && checkResult && hasProducts && totals && (
                <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium">
                    <Package className="h-4 w-4" />
                    Este proyecto tiene productos asignados
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {totals.equipments > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Equipos</span>
                        <Badge variant="secondary">{totals.equipments}</Badge>
                      </div>
                    )}
                    {totals.spareParts > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Repuestos</span>
                        <Badge variant="secondary">{totals.spareParts}</Badge>
                      </div>
                    )}
                    {totals.materials > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Materiales</span>
                        <Badge variant="secondary">{totals.materials}</Badge>
                      </div>
                    )}
                    <div className="col-span-2 flex items-center justify-between border-t pt-1 mt-1">
                      <span className="font-medium text-foreground">Total</span>
                      <Badge>{totals.total}</Badge>
                    </div>
                  </div>

                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    ¿Deseas continuar de todas formas?
                  </p>
                </div>
              )}

              {/* Sin productos */}
              {!isLoadingCheck && checkResult && !hasProducts && (
                <p>¿Deseas continuar?</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isLoadingCheck || isConfirming}
            className={
              targetStatus === "FINALIZADO"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : targetStatus === "INACTIVO"
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-primary text-primary-foreground"
            }
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando…
              </>
            ) : isLoadingCheck ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando…
              </>
            ) : (
              `Cambiar a ${STATUS_LABELS[targetStatus]}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
