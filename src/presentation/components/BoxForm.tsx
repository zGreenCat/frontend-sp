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
import { Loader2, Save, X, AlertCircle } from "lucide-react";
import { createBoxSchema, CreateBoxInput } from "@/shared/schemas";
import { BOX_TYPES, BOX_STATUS } from "@/shared/constants";
import { useWarehouses } from "@/hooks/useWarehouses";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BoxFormProps {
  onSubmit: (data: CreateBoxInput) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<CreateBoxInput>;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export function BoxForm({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading = false,
  mode = "create",
}: BoxFormProps) {
  // Cargar bodegas para el selector
  const { data: warehouses = [], isLoading: loadingWarehouses } = useWarehouses();

  const form = useForm<CreateBoxInput>({
    resolver: zodResolver(createBoxSchema),
    defaultValues: {
      qrCode: defaultValues?.qrCode || "",
      description: defaultValues?.description || "",
      type: defaultValues?.type || "NORMAL",
      status: defaultValues?.status || "ACTIVA",
      currentWeightKg: defaultValues?.currentWeightKg || 0,
      warehouseId: defaultValues?.warehouseId || "",
    },
  });

  const handleSubmit = async (data: CreateBoxInput) => {
    try {
      await onSubmit(data);
      if (mode === "create") {
        form.reset();
      }
    } catch (error) {
      console.error("Error al guardar caja:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Código QR (único, no modificable) */}
        <FormField
          control={form.control}
          name="qrCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código QR *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: BOX-001"
                  {...field}
                  disabled={isLoading || mode === "edit"}
                  className="h-11 font-mono"
                  readOnly={mode === "edit"}
                />
              </FormControl>
              <FormDescription className="text-xs">
                {mode === "edit"
                  ? "⚠️ El código QR no puede modificarse después de la creación"
                  : "Identificador único de la caja (solo letras, números, guiones y guiones bajos)"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {mode === "edit" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              El código QR es único e inmutable. No se puede modificar una vez creada la caja.
            </AlertDescription>
          </Alert>
        )}

        {/* Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción opcional de la caja..."
                  {...field}
                  disabled={isLoading}
                  className="min-h-[80px]"
                  maxLength={500}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Información adicional sobre la caja (máximo 500 caracteres)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo de caja (según backend) */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Caja *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={BOX_TYPES.PEQUEÑA}>Pequeña</SelectItem>
                  <SelectItem value={BOX_TYPES.NORMAL}>Normal</SelectItem>
                  <SelectItem value={BOX_TYPES.GRANDE}>Grande</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-xs">
                Tamaño de la caja según clasificación estándar
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Peso/Contenido actual (reemplaza unitCost) */}
        <FormField
          control={form.control}
          name="currentWeightKg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Peso/Contenido Actual (kg) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0.0"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  disabled={isLoading}
                  className="h-11"
                  min={0}
                  max={10000}
                  step="0.1"
                />
              </FormControl>
              <FormDescription className="text-xs">
                Peso o valor del contenido actual de la caja (0 - 10,000 kg)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bodega (nuevo campo obligatorio) */}
        <FormField
          control={form.control}
          name="warehouseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bodega *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading || loadingWarehouses}
              >
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={loadingWarehouses ? "Cargando bodegas..." : "Selecciona una bodega"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {warehouses.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No hay bodegas disponibles
                    </div>
                  ) : (
                  warehouses.map((warehouse: any) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.currentCapacityKg?.toFixed(0) || 0} / {warehouse.maxCapacityKg} kg)
                    </SelectItem>
                  ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription className="text-xs">
                Bodega donde se ubicará la caja
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Estado */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={BOX_STATUS.ACTIVA}>Activa</SelectItem>
                  <SelectItem value={BOX_STATUS.INACTIVA}>Inactiva</SelectItem>
                  <SelectItem value={BOX_STATUS.EN_USO}>En Uso</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-xs">
                Estado operativo de la caja
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botones de acción */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading || loadingWarehouses}
            className="flex-1 h-11 gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {mode === "create" ? "Crear Caja" : "Guardar Cambios"}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="h-11 gap-2"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
