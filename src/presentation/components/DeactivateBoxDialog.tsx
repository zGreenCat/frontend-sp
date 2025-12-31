"use client";

import { Button } from "@/components/ui/button";
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
import { Loader2, AlertTriangle } from "lucide-react";
import { useDeactivateBox } from "@/hooks/useBoxes";
import { useToast } from "@/hooks/use-toast";

interface DeactivateBoxDialogProps {
  boxId: string;
  boxQrCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeactivateBoxDialog({
  boxId,
  boxQrCode,
  open,
  onOpenChange,
}: DeactivateBoxDialogProps) {
  const { toast } = useToast();
  const deactivateMutation = useDeactivateBox();

  const handleDeactivate = async () => {
    try {
      await deactivateMutation.mutateAsync(boxId);

      toast({
        title: "✅ Caja desactivada",
        description: `La caja "${boxQrCode}" ha sido desactivada exitosamente.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error("Error al desactivar caja:", error);
      
      // Manejo específico para error de stock
      const errorMessage = error?.message || "No se pudo desactivar la caja.";
      
      toast({
        title: "❌ Error al desactivar",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            ¿Desactivar caja?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Estás a punto de desactivar la caja <strong>"{boxQrCode}"</strong>.
            </p>
            <p className="text-sm">
              Esta acción marcará la caja como inactiva. Si la caja tiene stock asignado,
              no podrá ser desactivada hasta que el stock sea removido.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deactivateMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDeactivate}
            disabled={deactivateMutation.isPending}
          >
            {deactivateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Desactivando...
              </>
            ) : (
              "Desactivar Caja"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
