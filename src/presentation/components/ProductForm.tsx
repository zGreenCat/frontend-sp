"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { createProductSchema, CreateProductInput } from "@/shared/schemas";
import { ProductKind } from "@/domain/entities/Product";

interface ProductFormProps {
  onSubmit: (data: CreateProductInput) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<CreateProductInput>;
  isLoading?: boolean;
  mode?: "create" | "edit";
  kind: ProductKind; // Tipo de producto fijo para el formulario
}

// Opciones de unidad de medida para materiales
const UNIT_OF_MEASURE_OPTIONS = [
  { value: 'UNIT', label: 'Unidad (UND)' },
  { value: 'KG', label: 'Kilogramo (KG)' },
  { value: 'LT', label: 'Litro (LT)' },
  { value: 'MT', label: 'Metro (MT)' },
  { value: 'M2', label: 'Metro cuadrado (M²)' },
  { value: 'M3', label: 'Metro cúbico (M³)' },
  { value: 'TON', label: 'Tonelada (TON)' },
  { value: 'GAL', label: 'Galón (GAL)' },
];

const CURRENCY_OPTIONS = [
  { value: 'CLP', label: 'Peso Chileno (CLP)' },
  { value: 'USD', label: 'Dólar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
];

export function ProductForm({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading = false,
  mode = "create",
  kind,
}: ProductFormProps) {
  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      kind,
      name: defaultValues?.name || "",
      sku: defaultValues?.sku || "",
      description: defaultValues?.description || "",
      currency: defaultValues?.currency || "CLP",
      isActive: defaultValues?.isActive ?? true,
      model: defaultValues?.model || "",
      unitOfMeasure: defaultValues?.unitOfMeasure || "UNIT",
      isHazardous: defaultValues?.isHazardous || false,
    },
  });

  const handleSubmit = async (data: CreateProductInput) => {
    await onSubmit(data);
  };

  // Helper para obtener el label del tipo de producto
  const getKindLabel = () => {
    switch (kind) {
      case 'EQUIPMENT':
        return 'Equipo';
      case 'MATERIAL':
        return 'Material';
      case 'SPARE_PART':
        return 'Repuesto';
      default:
        return 'Producto';
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Tipo de producto (readonly) */}
        <div className="rounded-lg bg-muted p-3">
          <p className="text-sm text-muted-foreground">
            Tipo de producto: <span className="font-medium text-foreground">{getKindLabel()}</span>
          </p>
        </div>

        {/* Nombre */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nombre <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nombre del producto" 
                  {...field} 
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Código (SKU) */}
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Código (SKU) <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: MAT-001, EQP-100" 
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  disabled={isLoading || mode === "edit"}
                  className="font-mono"
                />
              </FormControl>
              <FormDescription>
                {mode === "edit" 
                  ? "El código no puede ser modificado"
                  : "Código único del producto (se convertirá a mayúsculas)"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descripción del producto..."
                  className="resize-none"
                  rows={3}
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Modelo (solo para EQUIPMENT y SPARE_PART) */}
        {(kind === 'EQUIPMENT' || kind === 'SPARE_PART') && (
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Modelo <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Modelo del equipo/repuesto" 
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Unidad de medida (solo para MATERIAL) */}
        {kind === 'MATERIAL' && (
          <FormField
            control={form.control}
            name="unitOfMeasure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Unidad de medida <span className="text-destructive">*</span>
                </FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una unidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {UNIT_OF_MEASURE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Peligroso (solo para MATERIAL) */}
        {kind === 'MATERIAL' && (
          <FormField
            control={form.control}
            name="isHazardous"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Material peligroso</FormLabel>
                  <FormDescription>
                    Indica si el material es peligroso o requiere manejo especial
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Moneda */}
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Moneda <span className="text-destructive">*</span>
              </FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una moneda" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Estado Activo */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Estado</FormLabel>
                <FormDescription>
                  {field.value ? "Producto activo" : "Producto inactivo"}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Botones de acción */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "create" ? "Creando..." : "Guardando..."}
              </>
            ) : (
              <>{mode === "create" ? "Crear producto" : "Guardar cambios"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
