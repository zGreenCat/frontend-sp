"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/domain/entities/User";

interface ToggleUserStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export function ToggleUserStatusDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isLoading = false,
}: ToggleUserStatusDialogProps) {
  const [reason, setReason] = useState("");

  const isEnabling = user?.status === "DESHABILITADO";
  const action = isEnabling ? "habilitar" : "deshabilitar";
  const actionCapitalized = isEnabling ? "Habilitar" : "Deshabilitar";

  const handleConfirm = () => {
    onConfirm(reason.trim());
    setReason(""); // Limpiar el campo después de confirmar
  };

  const handleCancel = () => {
    setReason(""); // Limpiar el campo al cancelar
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿{actionCapitalized} usuario?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isEnabling
              ? `¿Confirma habilitar a ${user.name} ${user.lastName}? Podrá volver a acceder al sistema con sus asignaciones actuales.`
              : `¿Confirma deshabilitar a ${user.name} ${user.lastName}? No podrá acceder al sistema y sus asignaciones quedarán inactivas.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 my-4">
          <Label htmlFor="reason">
            Razón del cambio {!isEnabling && <span className="text-destructive">*</span>}
          </Label>
          <Textarea
            id="reason"
            placeholder={`Ej: ${isEnabling ? 'Usuario reincorporado a la empresa' : 'Usuario inactivo por solicitud'}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="resize-none"
            rows={3}
            disabled={isLoading}
          />
          {!isEnabling && (
            <p className="text-xs text-muted-foreground">
              La razón es obligatoria al deshabilitar un usuario
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || (!isEnabling && reason.trim().length === 0)}
            className="bg-primary text-primary-foreground"
          >
            {isLoading ? "Procesando..." : "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
