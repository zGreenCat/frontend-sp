"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Save, X, UserPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { TENANT_ID } from "@/shared/constants";
import { User } from "@/domain/entities/User";
import { useToast } from "@/hooks/use-toast";
import { useAssignManager } from "@/hooks/useAssignments";

interface AssignAreaJefesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  areaId: string;
  areaName: string;
  currentJefes: User[]; // Jefes ya asignados a esta área
  onSuccess: () => void;
}

export function AssignAreaJefesDialog({
  open,
  onOpenChange,
  areaId,
  areaName,
  currentJefes,
  onSuccess,
}: AssignAreaJefesDialogProps) {
  const { userRepo } = useRepositories(); // 👈 ya no usamos areaRepo acá
  const { toast } = useToast();
  
  const [availableJefes, setAvailableJefes] = useState<User[]>([]);
  const [selectedJefeId, setSelectedJefeId] = useState<string>("");
  const [loadingOptions, setLoadingOptions] = useState(true);

  // 👇 Mutación de asignación (use case + assignmentRepo por dentro)
  const assignManagerMutation = useAssignManager();
  const isAssigning = assignManagerMutation.isPending;

  useEffect(() => {
    if (open) {
      loadAvailableJefes();
      setSelectedJefeId("");
    }
  }, [open, areaId]);

  const loadAvailableJefes = async () => {
    setLoadingOptions(true);
    try {
      // Obtener todos los usuarios con rol JEFE_AREA desde el endpoint con filtro
      const response = await userRepo.findByRole("JEFE_AREA", TENANT_ID);
      const allJefes = response.data;

      console.log("🔍 Todos los jefes JEFE_AREA:", allJefes);
      console.log("📍 Jefes actuales del área:", currentJefes);

      // Filtrar solo los disponibles:
      // 1. Usuario debe estar habilitado
      // 2. NO debe tener una asignación activa a esta misma área
      const available = allJefes.filter((jefe) => {
        if (jefe.status !== "HABILITADO") return false;

        const isAlreadyAssigned = jefe.areaAssignments?.some(
          (assignment) =>
            assignment.areaId === areaId && assignment.isActive === true
        );

        return !isAlreadyAssigned;
      });

      console.log("✅ Jefes disponibles para asignar:", available);
      setAvailableJefes(available);
    } catch (error) {
      console.error("Error al cargar jefes disponibles:", error);
      toast({
        title: "❌ Error",
        description: "No se pudieron cargar los jefes de área disponibles",
        variant: "destructive",
      });
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedJefeId) {
      toast({
        title: "⚠️ Selecciona un jefe",
        description: "Debes seleccionar un jefe de área para asignar",
        variant: "destructive",
      });
      return;
    }

    try {
      // 👇 Ahora usamos la mutación (que llama al use case + assignmentRepo)
      await assignManagerMutation.mutateAsync({
        areaId,
        managerId: selectedJefeId,
      });

      const selectedJefe = availableJefes.find((j) => j.id === selectedJefeId);

      toast({
        title: "✅ Jefe asignado",
        description: `${selectedJefe?.name} ${selectedJefe?.lastName} ha sido asignado al área ${areaName}`,
      });

      onSuccess();          // dejarlo por si el padre quiere hacer algo extra
      onOpenChange(false);  // cerrar modal
    } catch (error: any) {
      console.error("Error al asignar jefe:", error);
      toast({
        title: "❌ Error al asignar",
        description:
          error.message || "No se pudo asignar el jefe al área",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setSelectedJefeId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Asignar Jefe de Área
          </DialogTitle>
          <DialogDescription>
            Selecciona un jefe de área para asignar a <strong>{areaName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información del área */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>📍 Área:</strong> {areaName}
            </p>
            <p className="text-sm text-blue-900 dark:text-blue-200 mt-1">
              <strong>👥 Jefes actuales:</strong> {currentJefes.length}
            </p>
          </div>

          {/* Select de jefes disponibles */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Jefe de Área Disponible</label>
            {loadingOptions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableJefes.length === 0 ? (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-4 text-center">
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  ⚠️ No hay jefes de área disponibles para asignar
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                  Todos los jefes habilitados ya están asignados a esta área
                </p>
              </div>
            ) : (
              <Select
                value={selectedJefeId}
                onValueChange={setSelectedJefeId}
                disabled={isAssigning}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un jefe de área..." />
                </SelectTrigger>
                <SelectContent>
                  {availableJefes.map((jefe) => (
                    <SelectItem key={jefe.id} value={jefe.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">
                          {jefe.name} {jefe.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {jefe.email}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              Solo usuarios con rol <strong>Jefe de Área</strong> habilitados y
              sin asignación activa a esta área
            </p>
          </div>

          {/* Info adicional si hay jefe seleccionado */}
          {selectedJefeId && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-3 text-sm">
              {(() => {
                const selected = availableJefes.find(
                  (j) => j.id === selectedJefeId
                );
                return (
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-200">
                      ✅ Jefe seleccionado:
                    </p>
                    <p className="text-green-800 dark:text-green-300 mt-1">
                      {selected?.name} {selected?.lastName}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                      {selected?.email}
                    </p>
                    {selected?.areaDetails &&
                      selected.areaDetails.length > 0 && (
                        <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                          <strong>Áreas actuales:</strong>{" "}
                          {selected.areaDetails.map((a) => a.name).join(", ")}
                        </p>
                      )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isAssigning}
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={
              isAssigning || !selectedJefeId || availableJefes.length === 0
            }
            className="flex-1"
          >
            {isAssigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Asignando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Asignar Jefe
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
