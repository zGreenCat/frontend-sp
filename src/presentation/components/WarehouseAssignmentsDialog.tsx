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
import { Loader2, Save, X, Building2, Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { useAreas } from "@/hooks/useAreas";
import { useUsers } from "@/hooks/useUsers";
import {
  useAssignWarehouseToArea,
  useAssignSupervisorToWarehouse,
  useRemoveAssignment,
} from "@/hooks/useAssignments";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { warehouseKeys } from "@/hooks/useWarehouses";
import { areaKeys } from "@/hooks/useAreas";
import { userKeys } from "@/hooks/useUsers";
import { Area } from "@/domain/entities/Area";

interface SupervisorAssignment {
  userId: string;
  fullName: string;
  assignmentId: string;
}

interface WarehouseAssignmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  warehouseName: string;
  currentAreaId?: string | null;
  currentAreaAssignmentId?: string | null;
  currentSupervisors: SupervisorAssignment[];
}

export function WarehouseAssignmentsDialog({
  open,
  onOpenChange,
  warehouseId,
  warehouseName,
  currentAreaId,
  currentAreaAssignmentId,
  currentSupervisors,
}: WarehouseAssignmentsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(
    currentAreaId || null
  );
  const [selectedSupervisorIds, setSelectedSupervisorIds] = useState<string[]>(
    []
  );
  const [saving, setSaving] = useState(false);

  // Fetch data
  const { data: areasResponse, isLoading: loadingAreas } = useAreas();
  const areas: Area[] = Array.isArray(areasResponse)
    ? areasResponse
    : [];

  const usersQuery = useUsers();
  const usersData = usersQuery.data;
  const users = Array.isArray(usersData)
    ? usersData
    : usersData?.data || [];
  const loadingUsers = usersQuery.isLoading;

  // Mutations
  const assignWarehouseToAreaMutation = useAssignWarehouseToArea();
  const assignSupervisorMutation = useAssignSupervisorToWarehouse();
  const removeAssignmentMutation = useRemoveAssignment();

  // Filter active areas and supervisors
  const activeAreas = areas.filter((area: Area) => area.status === "ACTIVO");
  const activeSupervisors = users.filter(
    (user) => user.role === "SUPERVISOR" && user.status === "HABILITADO"
  );

  // Initialize state when dialog opens or props change
  useEffect(() => {
    setSelectedAreaId(currentAreaId || null);
    setSelectedSupervisorIds(currentSupervisors.map((s) => s.userId));
  }, [currentAreaId, currentSupervisors, open]);

  // Prepare options for MultiSelect
  const supervisorOptions: Option[] = activeSupervisors.map((supervisor) => ({
    label: `${supervisor.name} ${supervisor.lastName} - ${supervisor.email}`,
    value: supervisor.id,
  }));

  const handleSave = async () => {
    setSaving(true);
    const errors: string[] = [];
    let areaChanged = false;
    let supervisorsChanged = false;

    try {
      // 1. Handle Area Assignment
      const hasAreaChanged = selectedAreaId !== (currentAreaId || null);

      if (hasAreaChanged) {
        // Remove current area assignment if exists
        if (currentAreaAssignmentId && currentAreaId) {
          try {
            await removeAssignmentMutation.mutateAsync({
              assignmentId: currentAreaAssignmentId,
              areaId: currentAreaId,
            });
          } catch (error) {
            console.error("Error al remover asignación de área:", error);
            errors.push("No se pudo remover el área anterior");
          }
        }

        // Assign to new area if selected
        if (selectedAreaId) {
          try {
            await assignWarehouseToAreaMutation.mutateAsync({
              areaId: selectedAreaId,
              warehouseId: warehouseId,
            });
            areaChanged = true;
          } catch (error) {
            console.error("Error al asignar nueva área:", error);
            errors.push("No se pudo asignar el área seleccionada");
          }
        } else {
          areaChanged = true; // Area was removed
        }
      }

      // 2. Handle Supervisor Assignments
      const currentSupervisorIds = currentSupervisors.map((s) => s.userId);
      const supervisorsToAdd = selectedSupervisorIds.filter(
        (id) => !currentSupervisorIds.includes(id)
      );
      const supervisorsToRemove = currentSupervisors.filter(
        (s) => !selectedSupervisorIds.includes(s.userId)
      );

      // Remove unselected supervisors
      for (const supervisor of supervisorsToRemove) {
        try {
          await removeAssignmentMutation.mutateAsync({
            assignmentId: supervisor.assignmentId,
            warehouseId: warehouseId, // ✅ Pasar warehouseId para invalidación
          });
          supervisorsChanged = true;
        } catch (error) {
          console.error(
            `Error al remover supervisor ${supervisor.fullName}:`,
            error
          );
          errors.push(`No se pudo remover a ${supervisor.fullName}`);
        }
      }

      // Add new supervisors
      for (const supervisorId of supervisorsToAdd) {
        try {
          await assignSupervisorMutation.mutateAsync({
            warehouseId: warehouseId,
            supervisorId: supervisorId,
          });
          supervisorsChanged = true;
        } catch (error) {
          const supervisor = activeSupervisors.find(
            (u) => u.id === supervisorId
          );
          console.error(
            `Error al asignar supervisor ${supervisor?.name}:`,
            error
          );
          errors.push(
            `No se pudo asignar a ${supervisor?.name} ${supervisor?.lastName}`
          );
        }
      }

      // 3. Show result toast
      if (!areaChanged && !supervisorsChanged && errors.length === 0) {
        toast({
          title: "Sin cambios",
          description: "No se realizaron modificaciones.",
        });
      } else if (errors.length === 0) {
        const changes: string[] = [];
        if (areaChanged) changes.push("área");
        if (supervisorsChanged) changes.push("supervisores");

        toast({
          title: "✅ Asignaciones actualizadas",
          description: `Se actualizaron las asignaciones de ${changes.join(" y ")} para la bodega "${warehouseName}".`,
        });
      } else {
        toast({
          title: "⚠️ Completado con errores",
          description: `Algunos cambios se guardaron, pero hubo problemas: ${errors.join(", ")}.`,
          variant: "default",
        });
      }

      // 4. Invalidate queries
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({
        queryKey: warehouseKeys.detail(warehouseId),
      });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      // Invalidar lista de supervisores de la bodega (todas las páginas)
      queryClient.invalidateQueries({
        queryKey: ['warehouse-supervisors', undefined, warehouseId],
      });
      
      if (currentAreaId) {
        queryClient.invalidateQueries({
          queryKey: areaKeys.detail(currentAreaId),
        });
      }
      if (selectedAreaId) {
        queryClient.invalidateQueries({
          queryKey: areaKeys.detail(selectedAreaId),
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error al gestionar asignaciones:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al gestionar las asignaciones.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Asignaciones</DialogTitle>
          <DialogDescription>
            Configura el área y los supervisores asignados a la bodega "
            {warehouseName}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sección 1: Área de la Bodega */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">Área de la Bodega</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Selecciona el área a la que pertenece esta bodega.
            </p>

            {loadingAreas ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Cargando áreas...
                </span>
              </div>
            ) : (
              <Select
                value={selectedAreaId || "none"}
                onValueChange={(value) =>
                  setSelectedAreaId(value === "none" ? null : value)
                }
                disabled={saving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un área..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin área asignada</SelectItem>
                  {activeAreas.map((area: Area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                      {area.description && (
                        <span className="text-xs text-muted-foreground ml-2">
                          - {area.description}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!loadingAreas && activeAreas.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">
                No hay áreas activas disponibles.
              </p>
            )}
          </div>

          <Separator />

          {/* Sección 2: Supervisores de la Bodega */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">
                Supervisores de la Bodega
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Selecciona los supervisores que estarán asignados a esta bodega.
            </p>

            {loadingUsers ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Cargando supervisores...
                </span>
              </div>
            ) : activeSupervisors.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No hay supervisores activos disponibles.
              </p>
            ) : (
              <>
                <MultiSelect
                  options={supervisorOptions}
                  selected={selectedSupervisorIds}
                  onChange={setSelectedSupervisorIds}
                  placeholder="Buscar y seleccionar supervisores..."
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  {activeSupervisors.length} supervisor(es) disponible(s) •{" "}
                  {selectedSupervisorIds.length} seleccionado(s)
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loadingAreas || loadingUsers}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
