"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserForm } from "./UserForm";
import { CreateUserInput } from "@/shared/schemas";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserInput) => Promise<void>;
  defaultValues?: Partial<CreateUserInput>;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export function UserDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isLoading = false,
  mode = "create",
}: UserDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (data: CreateUserInput) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {mode === "create" ? "Nuevo Usuario" : "Editar Usuario"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Completa los datos para crear un nuevo usuario en el sistema."
              : "Modifica los datos del usuario."}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <UserForm
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
