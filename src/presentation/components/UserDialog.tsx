"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserFormStepper } from "./UserFormStepper";
import { CreateUserInput } from "@/shared/schemas";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserInput) => Promise<void>;
  defaultValues?: Partial<CreateUserInput>;
  isLoading?: boolean;
}

export function UserDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isLoading = false,
}: UserDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (data: CreateUserInput) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      // No cerrar el dialog si hay error
      console.error("Error al crear usuario:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Header con fondo */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background px-6 py-5 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Nuevo Usuario</DialogTitle>
            <DialogDescription className="text-base mt-1.5">
              Completa los datos en 3 simples pasos
            </DialogDescription>
          </DialogHeader>
        </div>
        
        {/* Contenido */}
        <div className="px-6 py-6">
          <UserFormStepper
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            defaultValues={defaultValues}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
