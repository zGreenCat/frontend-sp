"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserForm } from "./UserForm";
import { AssignmentHistoryView } from "./AssignmentHistoryView";
import { CreateUserInput } from "@/shared/schemas";
import { TENANT_ID } from "@/shared/constants";
import { FileEdit, History } from "lucide-react";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserInput) => Promise<void>;
  defaultValues?: Partial<CreateUserInput> & { id?: string };
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

  // En modo edición, mostrar tabs con historial
  if (mode === "edit" && defaultValues?.id) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario y visualiza su historial de asignaciones.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="edit" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" className="gap-2">
                <FileEdit className="h-4 w-4" />
                Datos del Usuario
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                Historial de Asignaciones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="mt-4">
              <UserForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                defaultValues={defaultValues}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <AssignmentHistoryView 
                userId={defaultValues.id} 
                tenantId={TENANT_ID} 
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  }

  // Modo creación: solo formulario
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Completa los datos para crear un nuevo usuario en el sistema.
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
