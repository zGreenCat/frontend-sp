"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductForm } from "./ProductForm";
import { CreateProductInput } from "@/shared/schemas";
import { ProductKind } from "@/domain/entities/Product";
import { Product } from "@/domain/entities/Product";

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: ProductKind; // Tipo de producto a crear
  onSubmit: (data: CreateProductInput) => Promise<void>;
  isLoading?: boolean;
  onCreated?: (product: Product) => void; // Callback opcional cuando se crea exitosamente
}

export function CreateProductDialog({
  open,
  onOpenChange,
  kind,
  onSubmit,
  isLoading = false,
}: CreateProductDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (data: CreateProductInput) => {
    await onSubmit(data);
  };

  // Helper para obtener el título según el tipo
  const getTitle = () => {
    switch (kind) {
      case 'EQUIPMENT':
        return 'Nuevo Equipo';
      case 'MATERIAL':
        return 'Nuevo Material';
      case 'SPARE_PART':
        return 'Nuevo Repuesto';
      default:
        return 'Nuevo Producto';
    }
  };

  const getDescription = () => {
    switch (kind) {
      case 'EQUIPMENT':
        return 'Agrega un nuevo equipo al catálogo de productos.';
      case 'MATERIAL':
        return 'Agrega un nuevo material al catálogo de productos.';
      case 'SPARE_PART':
        return 'Agrega un nuevo repuesto al catálogo de productos.';
      default:
        return 'Agrega un nuevo producto al catálogo.';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <ProductForm
          kind={kind}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          mode="create"
        />
      </DialogContent>
    </Dialog>
  );
}
