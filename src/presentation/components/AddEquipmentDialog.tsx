"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { useAddBoxEquipment } from "@/hooks/useBoxInventory";
import { useToast } from "@/hooks/use-toast";
import { TENANT_ID } from "@/shared/constants";
import { ListProducts } from "@/application/usecases/product/ListProducts";
import { Product } from "@/domain/entities/Product";
import { Loader2 } from "lucide-react";

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boxId: string;
  boxQrCode: string;
}

export function AddEquipmentDialog({
  open,
  onOpenChange,
  boxId,
  boxQrCode,
}: AddEquipmentDialogProps) {
  const { productRepo } = useRepositories();
  const { toast } = useToast();
  const addEquipmentMutation = useAddBoxEquipment();

  const [equipments, setEquipments] = useState<Product[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [reason, setReason] = useState<string>("");

  // Cargar equipos cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      loadEquipments();
      // Reset form
      setSelectedEquipmentId("");
      setQuantity("1");
      setReason("");
    }
  }, [open]);

  const loadEquipments = async () => {
    setLoadingEquipments(true);
    try {
      const useCase = new ListProducts(productRepo);
      const result = await useCase.execute(TENANT_ID);

      if (result.ok) {
        // Filtrar solo equipos activos
        const filtered = result.value.filter(
          (p) => p.type === "EQUIPO" && p.status === "ACTIVO"
        );
        setEquipments(filtered);
      } else {
        toast({
          title: "❌ Error al cargar equipos",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Error al cargar equipos",
        description: error?.message || "No se pudieron cargar los equipos.",
        variant: "destructive",
      });
    } finally {
      setLoadingEquipments(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEquipmentId) {
      toast({
        title: "⚠️ Selecciona un equipo",
        description: "Debes seleccionar un equipo para agregar.",
        variant: "destructive",
      });
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: "⚠️ Cantidad inválida",
        description: "La cantidad debe ser un número mayor a 0.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addEquipmentMutation.mutateAsync({
        boxId,
        equipmentId: selectedEquipmentId,
        quantity: qty,
        reason: reason.trim() || undefined,
      });

      const selectedEquipment = equipments.find((e) => e.id === selectedEquipmentId);

      toast({
        title: "✅ Equipo agregado",
        description: `Se agregó "${selectedEquipment?.description}" a la caja ${boxQrCode}.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "❌ Error al agregar equipo",
        description: error?.message || "No se pudo agregar el equipo.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar Equipo</DialogTitle>
          <DialogDescription>
            Agrega un equipo al inventario de la caja <strong>{boxQrCode}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="equipment">Equipo *</Label>
            {loadingEquipments ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Select
                value={selectedEquipmentId}
                onValueChange={setSelectedEquipmentId}
                disabled={addEquipmentMutation.isPending}
              >
                <SelectTrigger id="equipment">
                  <SelectValue placeholder="Selecciona un equipo" />
                </SelectTrigger>
                <SelectContent>
                  {equipments.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No hay equipos disponibles
                    </div>
                  ) : (
                    equipments.map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.id}>
                        {equipment.description} ({equipment.sku})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={addEquipmentMutation.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Razón (opcional)</Label>
            <Input
              id="reason"
              type="text"
              placeholder="Ej: Asignación inicial, reemplazo, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={addEquipmentMutation.isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addEquipmentMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={addEquipmentMutation.isPending}>
              {addEquipmentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                "Agregar Equipo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
