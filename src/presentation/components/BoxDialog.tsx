"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BoxForm } from "./BoxForm";
import { CreateBoxInput } from "@/shared/schemas";

interface BoxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateBoxInput) => Promise<void>;
  defaultValues?: Partial<CreateBoxInput>;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export function BoxDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isLoading = false,
  mode = "create",
}: BoxDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (data: CreateBoxInput) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {mode === "create" ? "Nueva Caja" : "Editar Datos de la Caja"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Crea una nueva caja para gestionar contenedores y embalajes."
              : "Modifica los datos maestros de la caja (descripción, tipo, peso). Para cambiar bodega o estado, usa las opciones específicas."}
          </DialogDescription>
        </DialogHeader>
        <BoxForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          isLoading={isLoading}
          mode={mode}
        />
      </DialogContent>
    </Dialog>
  );
}
