"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AreaForm } from "./AreaForm";
import { CreateAreaInput } from "@/shared/schemas";

interface AreaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateAreaInput) => Promise<void>;
  defaultValues?: Partial<CreateAreaInput> & { id?: string };
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export function AreaDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isLoading = false,
  mode = "create",
}: AreaDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (data: CreateAreaInput) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nueva Área" : "Editar Área"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Crea una nueva área para organizar tus operaciones."
              : "Modifica la información del área seleccionada."}
          </DialogDescription>
        </DialogHeader>

        <AreaForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
