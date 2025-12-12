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
import { Loader2, Save, X, UserCog } from "lucide-react";
import { MultiSelect, type Option } from "@/components/ui/multi-select";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { TENANT_ID, USER_ROLES } from "@/shared/constants";

interface AssignManagersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  areaId: string;
  areaName: string;
  currentManagerIds: string[];
  onSuccess: () => void;
}

export function AssignManagersDialog({
  open,
  onOpenChange,
  areaId,
  areaName,
  currentManagerIds,
  onSuccess,
}: AssignManagersDialogProps) {
  const { userRepo, areaRepo } = useRepositories();
  const [managersOptions, setManagersOptions] = useState<Option[]>([]);
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>(currentManagerIds);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    if (open) {
      loadManagers();
      setSelectedManagerIds(currentManagerIds);
    }
  }, [open, currentManagerIds]);

  const loadManagers = async () => {
    setLoadingOptions(true);
    try {
      const response = await userRepo.findAll(TENANT_ID);
      const users = response.data || [];
      
      // Filtrar solo usuarios con rol JEFE y habilitados
      const managers = users.filter(u => {
        const userRole = typeof u.role === 'string' 
          ? u.role 
          : u.role && typeof u.role === 'object' && 'name' in u.role 
            ? (u.role as any).name 
            : '';
        
        return (
          (userRole === USER_ROLES.JEFE || userRole === 'AREA_MANAGER') &&
          u.status === 'HABILITADO'
        );
      });
      
      setManagersOptions(
        managers.map(m => ({
          label: `${m.name} ${m.lastName || ''} (${m.email})`,
          value: m.id,
        }))
      );
    } catch (error) {
      console.error("Error al cargar jefes:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Calcular jefes a agregar y a remover
      const managersToAdd = selectedManagerIds.filter(
        id => !currentManagerIds.includes(id)
      );
      const managersToRemove = currentManagerIds.filter(
        id => !selectedManagerIds.includes(id)
      );

      // Ejecutar asignaciones
      const promises: Promise<void>[] = [];
      
      for (const managerId of managersToAdd) {
        promises.push(areaRepo.assignManager(areaId, managerId));
      }
      
      for (const managerId of managersToRemove) {
        promises.push(areaRepo.removeManager(areaId, managerId));
      }

      await Promise.all(promises);

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al guardar asignaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedManagerIds(currentManagerIds);
    onOpenChange(false);
  };

  const hasChanges = 
    selectedManagerIds.length !== currentManagerIds.length ||
    selectedManagerIds.some(id => !currentManagerIds.includes(id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Asignar Jefes de Área
          </DialogTitle>
          <DialogDescription>
            Gestiona los jefes asignados al área <strong>{areaName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información del área */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>📍 Área:</strong> {areaName}
            </p>
            <p className="text-sm text-blue-900 dark:text-blue-200 mt-1">
              <strong>👥 Jefes actuales:</strong> {currentManagerIds.length}
            </p>
          </div>

          {/* MultiSelect de jefes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Jefes Asignados</label>
            {loadingOptions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : managersOptions.length === 0 ? (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-4 text-center">
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  ⚠️ No hay usuarios con rol Jefe disponibles
                </p>
              </div>
            ) : (
              <MultiSelect
                options={managersOptions}
                selected={selectedManagerIds}
                onChange={setSelectedManagerIds}
                placeholder="Selecciona jefes..."
                disabled={loading}
                className="w-full"
              />
            )}
            <p className="text-xs text-muted-foreground">
              Solo usuarios con rol <strong>Jefe de Área</strong> pueden ser asignados
            </p>
          </div>

          {/* Contador de jefes seleccionados */}
          <div className="rounded-lg bg-secondary/30 p-3 text-sm">
            <p className="font-medium">
              {selectedManagerIds.length === 0 ? (
                <span className="text-amber-600 dark:text-amber-400">
                  ⚠️ No hay jefes asignados
                </span>
              ) : (
                <span className="text-green-600 dark:text-green-400">
                  ✅ {selectedManagerIds.length} {selectedManagerIds.length === 1 ? 'jefe asignado' : 'jefes asignados'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !hasChanges || loadingOptions}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
