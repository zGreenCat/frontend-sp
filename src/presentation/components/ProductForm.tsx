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
import {
  Loader2,
  Weight,
  Ruler,
  Box as BoxIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  createProductSchema,
  updateProductSchema,
  CreateProductInput,
} from "@/shared/schemas";
import { ProductKind } from "@/domain/entities/Product";
import {
  useUnitsOfMeasure,
  useCurrencies,
} from "@/hooks/useUnitsAndCurrencies";
import { useEquipments } from "@/hooks/useEquipments";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";

interface ProductFormProps {
  onSubmit: (data: CreateProductInput) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<CreateProductInput>;
  isLoading?: boolean;
  mode?: "create" | "edit";
  kind: ProductKind; // Tipo de producto fijo para el formulario
}

export function ProductForm({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading = false,
  mode = "create",
  kind,
}: ProductFormProps) {
  // Catálogos desde backend
  const { data: units, isLoading: loadingUnits } = useUnitsOfMeasure();
  const { data: currencies, isLoading: loadingCurrencies } = useCurrencies();
  const { data: categories, isLoading: loadingCategories } =
    useMaterialCategories();

  // Equipos (para repuestos)
  const { data: equipmentsData, isLoading: loadingEquipments } = useEquipments({
    page: 1,
    limit: 100,
  });

  // Elegimos schema según modo
  const schema =
    mode === "create"
      ? createProductSchema
      : updateProductSchema.omit({ id: true });

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      kind,
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
      currencyId: defaultValues?.currencyId || "",
      monetaryValue:
        mode === "create"
          ? defaultValues?.monetaryValue ?? undefined
          : undefined,
      isActive: defaultValues?.isActive ?? true,

      // MATERIAL
      unitOfMeasureId: defaultValues?.unitOfMeasureId || "",
      isHazardous:
        typeof defaultValues?.isHazardous === "boolean"
          ? defaultValues.isHazardous
          : kind === "MATERIAL"
          ? false
          : undefined,
      categoryIds: defaultValues?.categoryIds || [],

      // EQUIPMENT
      model: defaultValues?.model || "",
      weightValue: defaultValues?.weightValue,
      weightUnitId: defaultValues?.weightUnitId || "",
      widthValue: defaultValues?.widthValue,
      widthUnitId: defaultValues?.widthUnitId || "",
      heightValue: defaultValues?.heightValue,
      heightUnitId: defaultValues?.heightUnitId || "",
      lengthValue: defaultValues?.lengthValue,
      lengthUnitId: defaultValues?.lengthUnitId || "",

      // SPARE_PART
      equipmentId: defaultValues?.equipmentId || "",
      category: defaultValues?.category || "COMPONENT",
    },
  });

  const handleSubmit = async (data: CreateProductInput) => {
    await onSubmit(data);
  };

  const getKindLabel = () => {
    switch (kind) {
      case "EQUIPMENT":
        return "Equipo";
      case "MATERIAL":
        return "Material";
      case "SPARE_PART":
        return "Repuesto";
      default:
        return "Producto";
    }
  };

  // Helpers para unidades
  const weightUnits = units?.filter((u) => u.type === "WEIGHT") ?? [];
  const lengthUnits = units?.filter((u) => u.type === "LENGTH") ?? [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Tipo de producto (readonly) */}
        <div className="rounded-lg bg-muted p-3">
          <p className="text-sm text-muted-foreground">
            Tipo de producto:{" "}
            <span className="font-medium text-foreground">
              {getKindLabel()}
            </span>
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

        {/* Modelo (solo EQUIPMENT) */}
        {kind === "EQUIPMENT" && (
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
                    placeholder="Modelo del equipo"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* SPARE_PART: datos específicos */}
        {kind === "SPARE_PART" && (
          <>
            {/* Equipo asociado */}
            <FormField
              control={form.control}
              name="equipmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Equipo asociado <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading || loadingEquipments}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingEquipments
                              ? "Cargando equipos..."
                              : "Selecciona un equipo"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {equipmentsData?.data?.map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.id}>
                          {equipment.name}
                          {equipment.model && ` - ${equipment.model}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Categoría del repuesto */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Categoría <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="COMPONENT">Componente</SelectItem>
                      <SelectItem value="SPARE">Repuesto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Dimensiones (EQUIPMENT y SPARE_PART) */}
        {(kind === "EQUIPMENT" || kind === "SPARE_PART") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BoxIcon className="h-5 w-5 text-muted-foreground" />
                Dimensiones y peso
              </CardTitle>
              <CardDescription>
                {kind === "EQUIPMENT"
                  ? "Todos los campos son obligatorios para equipos"
                  : "Campos opcionales para repuestos"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Peso */}
              <div>
                <FormLabel className="flex items-center gap-2 mb-2">
                  <Weight className="h-4 w-4 text-muted-foreground" />
                  Peso{" "}
                  {kind === "EQUIPMENT" && (
                    <span className="text-destructive">*</span>
                  )}
                </FormLabel>
                <div className="grid grid-cols-[1fr_160px] gap-2">
                  <FormField
                    control={form.control}
                    name="weightValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Ej: 500"
                            value={field.value === undefined ? "" : field.value}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                value === "" ? undefined : value
                              );
                            }}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weightUnitId"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading || loadingUnits}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Unidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {weightUnits.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.abbreviation}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Dimensiones */}
              <div>
                <FormLabel className="flex items-center gap-2 mb-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  Dimensiones (Ancho × Alto × Largo){" "}
                  {kind === "EQUIPMENT" && (
                    <span className="text-destructive">*</span>
                  )}
                </FormLabel>
                <div className="space-y-3">
                  {/* Unidad común para todas las dimensiones */}
                  <FormField
                    control={form.control}
                    name="widthUnitId"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel className="text-sm">
                            Unidad de medida:
                          </FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue("heightUnitId", value);
                              form.setValue("lengthUnitId", value);
                            }}
                            defaultValue={field.value}
                            disabled={isLoading || loadingUnits}
                          >
                            <FormControl>
                              <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {lengthUnits.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>
                                  {unit.name} ({unit.abbreviation})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Valores de dimensiones */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Ancho */}
                    <FormField
                      control={form.control}
                      name="widthValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-muted-foreground">
                            Ancho
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="100"
                              value={
                                field.value === undefined ? "" : field.value
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(
                                  value === "" ? undefined : value
                                );
                              }}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Alto */}
                    <FormField
                      control={form.control}
                      name="heightValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-muted-foreground">
                            Alto
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="150"
                              value={
                                field.value === undefined ? "" : field.value
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(
                                  value === "" ? undefined : value
                                );
                              }}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Largo */}
                    <FormField
                      control={form.control}
                      name="lengthValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-muted-foreground">
                            Largo
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="120"
                              value={
                                field.value === undefined ? "" : field.value
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(
                                  value === "" ? undefined : value
                                );
                              }}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* MATERIAL: peso estándar */}
        {kind === "MATERIAL" && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="weightValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peso estándar</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ej: 25"
                      value={field.value === undefined ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? undefined : value);
                      }}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Peso unitario típico del material.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unitOfMeasureId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Unidad de medida <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading || loadingUnits}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingUnits ? "Cargando..." : "Selecciona unidad"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {weightUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name} ({unit.abbreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Litro (L) o Kilogramo (kg).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* MATERIAL: peligroso */}
        {kind === "MATERIAL" && (
          <>
            <FormField
              control={form.control}
              name="isHazardous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>
                      Material peligroso{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormDescription>
                      Indica si el material es peligroso o requiere manejo
                      especial.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* MATERIAL: categorías (simple select → array) */}
            <FormField
              control={form.control}
              name="categoryIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría (opcional)</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value ? [value] : []);
                    }}
                    value={field.value?.[0] || ""}
                    disabled={isLoading || loadingCategories}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingCategories
                              ? "Cargando..."
                              : "Selecciona una categoría"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecciona la categoría principal del material.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Moneda y Valor */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="currencyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Moneda <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading || loadingCurrencies}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingCurrencies ? "Cargando..." : "Selecciona moneda"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencies?.map((currency) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        {currency.symbol} {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monetaryValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Valor unitario <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={
                      mode === "edit" && defaultValues?.monetaryValue != null
                        ? String(defaultValues.monetaryValue)
                        : "0.00"
                    }
                    value={
                      field.value === undefined || field.value === null
                        ? ""
                        : field.value
                    }
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={isLoading}
                    className="font-mono"
                  />
                </FormControl>
                <FormDescription>
                  Formato: 10.50 (sin separadores de miles).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Estado Activo - Solo en modo edición */}
        {mode === "edit" && (
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
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Botones */}
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
          <Button type="submit" disabled={isLoading} className="flex-1">
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
