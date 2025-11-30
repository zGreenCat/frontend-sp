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
import { Loader2, Save, X, Warehouse } from "lucide-react";
import { MultiSelect, type Option } from "@/components/ui/multi-select";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { TENANT_ID } from "@/shared/constants";
import { Warehouse as WarehouseEntity } from "@/domain/entities/Warehouse";

interface AssignWarehousesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  areaId: string;
  areaName: string;
  currentWarehouseIds: string[];
  onSuccess: () => void;
}

export function AssignWarehousesDialog({
  open,
  onOpenChange,
  areaId,
  areaName,
  currentWarehouseIds,
  onSuccess,
}: AssignWarehousesDialogProps) {
  const { warehouseRepo, areaRepo } = useRepositories();
  const [warehousesOptions, setWarehousesOptions] = useState<Option[]>([]);
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<string[]>(currentWarehouseIds);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    if (open) {
      loadWarehouses();
      setSelectedWarehouseIds(currentWarehouseIds);
    }
  }, [open, currentWarehouseIds]);

  const loadWarehouses = async () => {
    setLoadingOptions(true);
    try {
      const warehouses = await warehouseRepo.findAll(TENANT_ID);
      
      // Filtrar solo bodegas activas
      const activeWarehouses = warehouses.filter(w => w.status === 'ACTIVO');
      
      setWarehousesOptions(
        activeWarehouses.map(w => ({
          label: `${w.name} (${w.capacityKg} kg)`,
          value: w.id,
        }))
      );
    } catch (error) {
      console.error("Error al cargar bodegas:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Calcular bodegas a agregar y a remover
      const warehousesToAdd = selectedWarehouseIds.filter(
        id => !currentWarehouseIds.includes(id)
      );
      const warehousesToRemove = currentWarehouseIds.filter(
        id => !selectedWarehouseIds.includes(id)
      );

      // Ejecutar asignaciones
      const promises: Promise<void>[] = [];
      
      for (const warehouseId of warehousesToAdd) {
        promises.push(areaRepo.assignWarehouse(areaId, warehouseId));
      }
      
      for (const warehouseId of warehousesToRemove) {
        promises.push(areaRepo.removeWarehouse(areaId, warehouseId));
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
    setSelectedWarehouseIds(currentWarehouseIds);
    onOpenChange(false);
  };

  const hasChanges = 
    selectedWarehouseIds.length !== currentWarehouseIds.length ||
    selectedWarehouseIds.some(id => !currentWarehouseIds.includes(id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Asignar Bodegas
          </DialogTitle>
          <DialogDescription>
            Gestiona las bodegas asignadas al área <strong>{areaName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información del área */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>📍 Área:</strong> {areaName}
            </p>
            <p className="text-sm text-blue-900 dark:text-blue-200 mt-1">
              <strong>📦 Bodegas actuales:</strong> {currentWarehouseIds.length}
            </p>
          </div>

          {/* MultiSelect de bodegas */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Bodegas Asignadas</label>
            {loadingOptions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <MultiSelect
                options={warehousesOptions}
                selected={selectedWarehouseIds}
                onChange={setSelectedWarehouseIds}
                placeholder="Selecciona bodegas..."
                disabled={loading}
                className="w-full"
              />
            )}
            <p className="text-xs text-muted-foreground">
              Selecciona una o más bodegas para asignar al área
            </p>
          </div>

          {/* Contador de bodegas seleccionadas */}
          <div className="rounded-lg bg-secondary/30 p-3 text-sm">
            <p className="font-medium">
              {selectedWarehouseIds.length === 0 ? (
                <span className="text-amber-600 dark:text-amber-400">
                  ⚠️ No hay bodegas asignadas
                </span>
              ) : (
                <span className="text-green-600 dark:text-green-400">
                  ✅ {selectedWarehouseIds.length} {selectedWarehouseIds.length === 1 ? 'bodega asignada' : 'bodegas asignadas'}
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
