"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, TruckIcon } from "lucide-react";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useMoveBox } from "@/hooks/useBoxes";
import { useToast } from "@/hooks/use-toast";

interface MoveBoxDialogProps {
  boxId: string;
  boxQrCode: string;
  currentWarehouseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveBoxDialog({
  boxId,
  boxQrCode,
  currentWarehouseId,
  open,
  onOpenChange,
}: MoveBoxDialogProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const { toast } = useToast();

  const { data: warehouses = [], isLoading: loadingWarehouses } = useWarehouses();
  const moveBoxMutation = useMoveBox();

  const availableWarehouses = warehouses.filter((w: any) => w.id !== currentWarehouseId);

  const handleMove = async () => {
    if (!selectedWarehouseId) {
      toast({
        title: "⚠️ Campo requerido",
        description: "Selecciona una bodega destino.",
        variant: "destructive",
      });
      return;
    }

    try {
      await moveBoxMutation.mutateAsync({
        id: boxId,
        warehouseId: selectedWarehouseId,
      });

      toast({
        title: "✅ Caja movida",
        description: `La caja "${boxQrCode}" ha sido movida exitosamente.`,
      });

      onOpenChange(false);
      setSelectedWarehouseId("");
    } catch (error: any) {
      console.error("Error al mover caja:", error);
      toast({
        title: "❌ Error al mover caja",
        description: error?.message || "No se pudo mover la caja. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5" />
            Mover Caja
          </DialogTitle>
          <DialogDescription>
            Selecciona la bodega destino para mover la caja "{boxQrCode}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="warehouse">Bodega Destino *</Label>
            <Select
              value={selectedWarehouseId}
              onValueChange={setSelectedWarehouseId}
              disabled={loadingWarehouses || moveBoxMutation.isPending}
            >
              <SelectTrigger id="warehouse">
                <SelectValue placeholder={loadingWarehouses ? "Cargando..." : "Selecciona una bodega"} />
              </SelectTrigger>
              <SelectContent>
                {availableWarehouses.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No hay otras bodegas disponibles
                  </div>
                ) : (
                  availableWarehouses.map((warehouse: any) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.currentCapacityKg?.toFixed(0) || 0} / {warehouse.maxCapacityKg} kg)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={moveBoxMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleMove}
            disabled={moveBoxMutation.isPending || !selectedWarehouseId}
          >
            {moveBoxMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Moviendo...
              </>
            ) : (
              "Mover Caja"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
