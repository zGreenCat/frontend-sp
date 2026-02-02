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
import { useAddBoxMaterial } from "@/hooks/useBoxInventory";
import { useToast } from "@/hooks/use-toast";
import { TENANT_ID } from "@/shared/constants";
import { ListProducts } from "@/application/usecases/product/ListProducts";
import { Product } from "@/domain/entities/Product";
import { Loader2 } from "lucide-react";

interface AddMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boxId: string;
  boxQrCode: string;
}

export function AddMaterialDialog({
  open,
  onOpenChange,
  boxId,
  boxQrCode,
}: AddMaterialDialogProps) {
  const { productRepo } = useRepositories();
  const { toast } = useToast();
  const addMaterialMutation = useAddBoxMaterial();

  const [materials, setMaterials] = useState<Product[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [reason, setReason] = useState<string>("");

  // Cargar materiales cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      loadMaterials();
      // Reset form
      setSelectedMaterialId("");
      setQuantity("1");
      setReason("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadMaterials = async () => {
    setLoadingMaterials(true);
    try {
      const useCase = new ListProducts(productRepo);
      const response = await useCase.execute({ 
        kind: "MATERIAL", 
        isActive: true
      });

      // La respuesta ahora es PaginatedResponse<Product>
      setMaterials(response.data);
    } catch (error: any) {
      toast({
        title: "❌ Error al cargar materiales",
        description: error?.message || "No se pudieron cargar los materiales.",
        variant: "destructive",
      });
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMaterialId) {
      toast({
        title: "⚠️ Selecciona un material",
        description: "Debes seleccionar un material para agregar.",
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
      await addMaterialMutation.mutateAsync({
        boxId,
        materialId: selectedMaterialId,
        quantity: qty,
        reason: reason.trim() || undefined,
      });

      const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

      toast({
        title: "✅ Material agregado",
        description: `Se agregó "${selectedMaterial?.description}" a la caja ${boxQrCode}.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "❌ Error al agregar material",
        description: error?.message || "No se pudo agregar el material.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar Material</DialogTitle>
          <DialogDescription>
            Agrega un material al inventario de la caja <strong>{boxQrCode}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material">Material *</Label>
            {loadingMaterials ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Select
                value={selectedMaterialId}
                onValueChange={setSelectedMaterialId}
                disabled={addMaterialMutation.isPending}
              >
                <SelectTrigger id="material">
                  <SelectValue placeholder="Selecciona un material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No hay materiales disponibles
                    </div>
                  ) : (
                    materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.description} ({material.sku})
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
              disabled={addMaterialMutation.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Razón (opcional)</Label>
            <Input
              id="reason"
              type="text"
              placeholder="Ej: Asignación inicial, reabastecimiento, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={addMaterialMutation.isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addMaterialMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={addMaterialMutation.isPending}>
              {addMaterialMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                "Agregar Material"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
