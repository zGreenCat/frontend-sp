"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductForm } from "./ProductForm";
import { Product, ProductKind } from "@/domain/entities/Product";
import { CreateProductInput, UpdateProductInput } from "@/shared/schemas";

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product; // Producto a editar (ya cargado)
  onSubmit: (data: UpdateProductInput) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Diálogo para editar un producto existente
 * Reutiliza ProductForm en modo edición
 */
export function EditProductDialog({
  open,
  onOpenChange,
  product,
  onSubmit,
  isLoading = false,
}: EditProductDialogProps) {
  
  // Helper para obtener el título según el tipo
  const getTitle = () => {
    switch (product.kind) {
      case 'EQUIPMENT':
        return 'Editar Equipo';
      case 'MATERIAL':
        return 'Editar Material';
      case 'SPARE_PART':
        return 'Editar Repuesto';
      default:
        return 'Editar Producto';
    }
  };

  // Helper para obtener la descripción según el tipo
  const getDescription = () => {
    switch (product.kind) {
      case 'EQUIPMENT':
        return 'Modifica los datos del equipo. El código (SKU) no puede cambiar.';
      case 'MATERIAL':
        return 'Modifica los datos del material. El código (SKU) no puede cambiar.';
      case 'SPARE_PART':
        return 'Modifica los datos del repuesto. El código (SKU) no puede cambiar.';
      default:
        return 'Modifica los datos del producto. El código (SKU) no puede cambiar.';
    }
  };

  // Transformar datos del producto a formato de formulario
  const defaultValues: Partial<CreateProductInput> = {
    kind: product.kind,
    name: product.name,
    sku: product.sku || '',
    description: product.description || '',
    currency: (product.currency as 'CLP' | 'USD' | 'EUR') || 'CLP',
    isActive: product.isActive,
    model: product.model || '',
    unitOfMeasure: product.unitOfMeasure || 'UNIT',
    isHazardous: product.isHazardous || false,
  };

  // Handler para transformar CreateProductInput a UpdateProductInput
  const handleFormSubmit = async (data: CreateProductInput) => {
    // Convertir a UpdateProductInput (sin kind, con id)
    const updateInput: UpdateProductInput = {
      id: product.id,
      name: data.name,
      // sku: data.sku, // No incluir SKU porque es readonly
      description: data.description,
      currency: data.currency,
      isActive: data.isActive,
      model: data.model,
      unitOfMeasure: data.unitOfMeasure,
      isHazardous: data.isHazardous,
      // TODO: Agregar justification cuando backend lo soporte
    };

    await onSubmit(updateInput);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <ProductForm
          kind={product.kind}
          defaultValues={defaultValues}
          onSubmit={handleFormSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
          mode="edit"
        />
      </DialogContent>
    </Dialog>
  );
}
