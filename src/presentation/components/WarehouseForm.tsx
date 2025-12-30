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
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, X } from "lucide-react";
import { createWarehouseSchema, CreateWarehouseInput } from "@/shared/schemas";

interface WarehouseFormProps {
  onSubmit: (data: CreateWarehouseInput) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<CreateWarehouseInput>;
  isLoading?: boolean;
}

export function WarehouseForm({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading = false,
}: WarehouseFormProps) {
  const form = useForm<CreateWarehouseInput>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      maxCapacityKg: defaultValues?.maxCapacityKg || 900,
      isEnabled: defaultValues?.isEnabled ?? true,
    },
  });

  const handleSubmit = async (data: CreateWarehouseInput) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error("Error al guardar bodega:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Nombre de la bodega */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Bodega *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Bodega Central A"
                  {...field}
                  disabled={isLoading}
                  className="h-11"
                />
              </FormControl>
              <FormDescription className="text-xs">
                Identificador único de la bodega (2-100 caracteres)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Capacidad máxima */}
        <FormField
          control={form.control}
          name="maxCapacityKg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidad Máxima (Kg) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="900"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  disabled={isLoading}
                  className="h-11"
                  min={1}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Capacidad máxima de almacenamiento en kilogramos (mínimo 1 Kg)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Estado habilitado/deshabilitado */}
        <FormField
          control={form.control}
          name="isEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-secondary/30">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Estado de la Bodega</FormLabel>
                <FormDescription className="text-xs">
                  {field.value
                    ? "La bodega está habilitada y operativa"
                    : "La bodega está deshabilitada temporalmente"}
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
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-primary text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Bodega
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
