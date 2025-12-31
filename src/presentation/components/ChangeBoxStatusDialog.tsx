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
import { Loader2, ToggleLeft } from "lucide-react";
import { useChangeBoxStatus } from "@/hooks/useBoxes";
import { useToast } from "@/hooks/use-toast";
import { BOX_STATUS } from "@/shared/constants";

interface ChangeBoxStatusDialogProps {
  boxId: string;
  boxQrCode: string;
  currentStatus: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeBoxStatusDialog({
  boxId,
  boxQrCode,
  currentStatus,
  open,
  onOpenChange,
}: ChangeBoxStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const { toast } = useToast();

  const changeStatusMutation = useChangeBoxStatus();

  const statusOptions = [
    { value: BOX_STATUS.ACTIVA, label: "Activa" },
    { value: BOX_STATUS.INACTIVA, label: "Inactiva" },
    { value: BOX_STATUS.EN_USO, label: "En Uso" },
  ];

  const handleChangeStatus = async () => {
    if (selectedStatus === currentStatus) {
      toast({
        title: "⚠️ Sin cambios",
        description: "El estado seleccionado es el mismo que el actual.",
        variant: "destructive",
      });
      return;
    }

    try {
      await changeStatusMutation.mutateAsync({
        id: boxId,
        status: selectedStatus,
      });

      toast({
        title: "✅ Estado actualizado",
        description: `El estado de la caja "${boxQrCode}" ha sido cambiado a ${selectedStatus}.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error("Error al cambiar estado:", error);
      toast({
        title: "❌ Error al cambiar estado",
        description: error?.message || "No se pudo cambiar el estado. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ToggleLeft className="h-5 w-5" />
            Cambiar Estado
          </DialogTitle>
          <DialogDescription>
            Cambia el estado operativo de la caja "{boxQrCode}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">Nuevo Estado *</Label>
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              disabled={changeStatusMutation.isPending}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={changeStatusMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleChangeStatus}
            disabled={changeStatusMutation.isPending}
          >
            {changeStatusMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cambiando...
              </>
            ) : (
              "Cambiar Estado"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
