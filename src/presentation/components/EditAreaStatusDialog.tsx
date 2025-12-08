"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

interface EditAreaStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area: {
    id: string;
    name: string;
    status: "ACTIVO" | "INACTIVO";
  };
  onSubmit: (data: { name: string; isActive: boolean }) => Promise<void>;
  isLoading?: boolean;
}

export function EditAreaStatusDialog({
  open,
  onOpenChange,
  area,
  onSubmit,
  isLoading = false,
}: EditAreaStatusDialogProps) {
  const [name, setName] = useState(area.name);
  const [isActive, setIsActive] = useState(area.status === "ACTIVO");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, isActive });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Área</DialogTitle>
          <DialogDescription>
            Modifica el nombre o el estado de activación del área
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Nombre del área */}
            <div className="space-y-2">
              <Label htmlFor="area-name">Nombre del Área</Label>
              <Input
                id="area-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ingrese el nombre del área"
                required
                disabled={isLoading}
              />
            </div>

            {/* Switch de activación */}
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="area-active">Estado del Área</Label>
                <div className="text-sm text-muted-foreground">
                  {isActive ? "El área está activa" : "El área está inactiva"}
                </div>
              </div>
              <Switch
                id="area-active"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
