"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ProductForm } from "./ProductForm";
import { Product } from "@/domain/entities/Product";
import {
  CreateProductInput,
  UpdateProductInput,
} from "@/shared/schemas";

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
      case "EQUIPMENT":
        return "Editar Equipo";
      case "MATERIAL":
        return "Editar Material";
      case "SPARE_PART":
        return "Editar Repuesto";
      default:
        return "Editar Producto";
    }
  };

  // Helper para obtener la descripción según el tipo
  const getDescription = () => {
    switch (product.kind) {
      case "EQUIPMENT":
        return "Modifica los datos del equipo. El código (SKU) no puede cambiar.";
      case "MATERIAL":
        return "Modifica los datos del material. El código (SKU) no puede cambiar.";
      case "SPARE_PART":
        return "Modifica los datos del repuesto. El código (SKU) no puede cambiar.";
      default:
        return "Modifica los datos del producto. El código (SKU) no puede cambiar.";
    }
  };

  /**
   * Transformar el producto de dominio a los valores por defecto del formulario.
   * Esto “aplana” las dimensiones y usa fallback cuando vienen desde `dimensions`.
   */
  const defaultValues: Partial<CreateProductInput> = {
    kind: product.kind,
    name: product.name,
    description: product.description || "",
    currencyId: product.currencyId || "",
    // monetaryValue: puede venir como monetaryValue o price en el dominio
    monetaryValue:
      product.monetaryValue !== undefined
        ? Number(product.monetaryValue)
        : product.price !== undefined
        ? Number(product.price)
        : undefined,
    isActive: product.isActive,

    // EQUIPMENT / SPARE_PART
    model: product.model || "",

    // SPARE_PART
    equipmentId: product.equipmentId || "",
    category: product.category || undefined,

    // Dimensiones (pueden venir “aplanadas” o desde product.dimensions)
    weightValue:
      product.weightValue ??
      product.dimensions?.weight?.value ??
      undefined,
    weightUnitId:
      product.weightUnitId ??
      product.dimensions?.weight?.unit?.id ??
      "",
    widthValue:
      product.widthValue ??
      product.dimensions?.width?.value ??
      undefined,
    widthUnitId:
      product.widthUnitId ??
      product.dimensions?.width?.unit?.id ??
      "",
    heightValue:
      product.heightValue ??
      product.dimensions?.height?.value ??
      undefined,
    heightUnitId:
      product.heightUnitId ??
      product.dimensions?.height?.unit?.id ??
      "",
    lengthValue:
      product.lengthValue ??
      product.dimensions?.length?.value ??
      undefined,
    lengthUnitId:
      product.lengthUnitId ??
      product.dimensions?.length?.unit?.id ??
      "",

    // MATERIAL
    unitOfMeasureId: product.unitOfMeasureId || "",
    isHazardous: product.isHazardous ?? false,
    categoryIds: product.categoryIds || [],
  };

  /**
   * Handler para transformar CreateProductInput (form) a UpdateProductInput (PATCH)
   * Solo incluye los campos que realmente cambiaron respecto al producto original.
   */
  const handleFormSubmit = async (data: CreateProductInput) => {
    const updateInput: UpdateProductInput = {
      id: product.id,
    };

    // Helpers para comparar valores con null/undefined
    const same = (a: unknown, b: unknown) =>
      a === b || (a == null && b == null);

    // --- CAMPOS COMUNES ---
    if (!same(data.name, product.name)) {
      updateInput.name = data.name;
    }

    if (!same(data.description ?? "", product.description ?? "")) {
      updateInput.description = data.description;
    }

    if (!same(data.currencyId, product.currencyId)) {
      updateInput.currencyId = data.currencyId;
    }

    const originalMonetary =
      product.monetaryValue !== undefined
        ? product.monetaryValue
        : product.price;

    if (!same(data.monetaryValue, originalMonetary)) {
      updateInput.monetaryValue = data.monetaryValue;
    }

    if (!same(data.isActive, product.isActive)) {
      updateInput.isActive = data.isActive;
    }

    // --- CAMPOS EQUIPMENT / SPARE_PART ---
    if (product.kind === "EQUIPMENT" || product.kind === "SPARE_PART") {
      if (!same(data.model ?? "", product.model ?? "")) {
        updateInput.model = data.model;
      }

      const originalWeight =
        product.weightValue ?? product.dimensions?.weight?.value;
      if (!same(data.weightValue, originalWeight)) {
        updateInput.weightValue = data.weightValue;
      }

      const originalWeightUnitId =
        product.weightUnitId ?? product.dimensions?.weight?.unit?.id;
      if (!same(data.weightUnitId, originalWeightUnitId)) {
        updateInput.weightUnitId = data.weightUnitId;
      }

      const originalWidth =
        product.widthValue ?? product.dimensions?.width?.value;
      if (!same(data.widthValue, originalWidth)) {
        updateInput.widthValue = data.widthValue;
      }

      const originalWidthUnitId =
        product.widthUnitId ?? product.dimensions?.width?.unit?.id;
      if (!same(data.widthUnitId, originalWidthUnitId)) {
        updateInput.widthUnitId = data.widthUnitId;
      }

      const originalHeight =
        product.heightValue ?? product.dimensions?.height?.value;
      if (!same(data.heightValue, originalHeight)) {
        updateInput.heightValue = data.heightValue;
      }

      const originalHeightUnitId =
        product.heightUnitId ?? product.dimensions?.height?.unit?.id;
      if (!same(data.heightUnitId, originalHeightUnitId)) {
        updateInput.heightUnitId = data.heightUnitId;
      }

      const originalLength =
        product.lengthValue ?? product.dimensions?.length?.value;
      if (!same(data.lengthValue, originalLength)) {
        updateInput.lengthValue = data.lengthValue;
      }

      const originalLengthUnitId =
        product.lengthUnitId ?? product.dimensions?.length?.unit?.id;
      if (!same(data.lengthUnitId, originalLengthUnitId)) {
        updateInput.lengthUnitId = data.lengthUnitId;
      }
    }

    // --- CAMPOS SPARE_PART ---
    if (product.kind === "SPARE_PART") {
      if (!same(data.equipmentId, product.equipmentId)) {
        updateInput.equipmentId = data.equipmentId;
      }

      if (!same(data.category, product.category)) {
        updateInput.category = data.category;
      }
    }

    // --- CAMPOS MATERIAL ---
    if (product.kind === "MATERIAL") {
      if (!same(data.unitOfMeasureId, product.unitOfMeasureId)) {
        updateInput.unitOfMeasureId = data.unitOfMeasureId;
      }

      if (!same(data.isHazardous, product.isHazardous)) {
        updateInput.isHazardous = data.isHazardous;
      }

      const originalCategoryIds = product.categoryIds ?? [];
      const newCategoryIds = data.categoryIds ?? [];

      if (
        JSON.stringify(originalCategoryIds) !==
        JSON.stringify(newCategoryIds)
      ) {
        updateInput.categoryIds = newCategoryIds;
      }
    }

    // Llamar al handler externo con el payload de PATCH
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
