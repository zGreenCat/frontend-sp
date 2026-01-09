"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WarehouseForm } from "./WarehouseForm";
import { CreateWarehouseInput } from "@/shared/schemas";

interface WarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    data: CreateWarehouseInput,
    assignments?: { areaId?: string; supervisorId?: string }
  ) => Promise<void>;
  defaultValues?: Partial<CreateWarehouseInput>;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export function WarehouseDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isLoading = false,
  mode = "create",
}: WarehouseDialogProps) {
  const [pendingAssignments, setPendingAssignments] = useState<{
    areaId?: string;
    supervisorId?: string;
  }>();

  const handleCancel = () => {
    onOpenChange(false);
    setPendingAssignments(undefined);
  };

  const handleSubmit = async (data: CreateWarehouseInput) => {
    await onSubmit(data, pendingAssignments);
    setPendingAssignments(undefined);
  };

  const handleAssignmentsSelected = (assignments: {
    areaId?: string;
    supervisorId?: string;
  }) => {
    setPendingAssignments(assignments);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {mode === "create" ? "Nueva Bodega" : "Editar Bodega"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Crea una nueva bodega para gestionar tu almacenamiento."
              : "Modifica la información de la bodega seleccionada."}
          </DialogDescription>
        </DialogHeader>

        <WarehouseForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          isLoading={isLoading}
          mode={mode}
          onAssignmentsSelected={handleAssignmentsSelected}
        />
      </DialogContent>
    </Dialog>
  );
}
