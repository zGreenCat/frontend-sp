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
import { UserFormStepper } from "./UserFormStepper";
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
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      // No cerrar el dialog si hay error
      console.error("Error al crear usuario:", error);
    }
  };

  // En modo edición, mostrar tabs con historial
  if (mode === "edit" && defaultValues?.id) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[95vh] p-0 gap-0 overflow-hidden">
          {/* Header con fondo */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background px-6 py-5 border-b">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Editar Usuario</DialogTitle>
              <DialogDescription className="text-base mt-1.5">
                Modifica los datos del usuario y visualiza su historial de asignaciones.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Contenido scrollable */}
          <div className="overflow-y-auto px-6 py-5">
            <Tabs defaultValue="edit">
              <TabsList className="grid w-full grid-cols-2 mb-5">
                <TabsTrigger value="edit" className="gap-2">
                  <FileEdit className="h-4 w-4" />
                  Datos del Usuario
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  Historial de Asignaciones
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="mt-0">
                <UserForm
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  defaultValues={defaultValues}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <AssignmentHistoryView 
                  userId={defaultValues.id} 
                  tenantId={TENANT_ID} 
                />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Modo creación: formulario por pasos
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
