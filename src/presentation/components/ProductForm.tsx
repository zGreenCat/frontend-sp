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
import { useUnitsOfMeasure, useCurrencies } from "@/hooks/useUnitsAndCurrencies";
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
  // ✅ Consumir catálogos desde backend
  const { data: units, isLoading: loadingUnits } = useUnitsOfMeasure();
  const { data: currencies, isLoading: loadingCurrencies } = useCurrencies();
  const { data: categories, isLoading: loadingCategories } = useMaterialCategories();
  // Solo cargar equipos si el tipo es SPARE_PART
  const shouldLoadEquipments = kind === 'SPARE_PART';
  const { data: equipmentsData, isLoading: loadingEquipments } = useEquipments({ 
    page: 1, 
    limit: 100,
  });

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      kind,
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
      currencyId: defaultValues?.currencyId || "",
      monetaryValue: defaultValues?.monetaryValue || 0,
      isActive: defaultValues?.isActive ?? true,
      model: defaultValues?.model || "",
      unitOfMeasureId: defaultValues?.unitOfMeasureId || "",
      isHazardous: defaultValues?.isHazardous || false,
      categoryId: defaultValues?.categoryId || "",
      // Dimensiones para equipos
      weightValue: defaultValues?.weightValue || 0,
      weightUnitId: defaultValues?.weightUnitId || "",
      widthValue: defaultValues?.widthValue || 0,
      widthUnitId: defaultValues?.widthUnitId || "",
      heightValue: defaultValues?.heightValue || 0,
      heightUnitId: defaultValues?.heightUnitId || "",
      lengthValue: defaultValues?.lengthValue || 0,
      lengthUnitId: defaultValues?.lengthUnitId || "",
      // Campos para repuestos
      equipmentId: defaultValues?.equipmentId || "",
      category: defaultValues?.category || "COMPONENT",
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

        {/* Modelo (solo para EQUIPMENT) - Los repuestos no tienen modelo */}
        {kind === 'EQUIPMENT' && (
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

        {/* Campos específicos de SPARE_PART */}
        {kind === 'SPARE_PART' && (
          <>
            {/* Equipo asociado */}
            <FormField
              control={form.control}
              name="equipmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipo asociado (opcional)</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                    defaultValue={field.value || "none"}
                    disabled={isLoading || loadingEquipments}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingEquipments ? "Cargando equipos..." : "Selecciona un equipo"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {equipmentsData?.data?.map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.id}>
                          {equipment.name} {equipment.model && `- ${equipment.model}`}
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

        {/* Dimensiones (para EQUIPMENT y SPARE_PART) */}
        {(kind === 'EQUIPMENT' || kind === 'SPARE_PART') && (
          <>
            {/* Peso */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weightValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Peso <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="500"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                    <FormLabel>
                      Unidad peso <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isLoading || loadingUnits}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingUnits ? "Cargando..." : "Unidad"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units?.filter(u => u.type === 'WEIGHT').map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ancho */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="widthValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Ancho <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="widthUnitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Unidad ancho <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isLoading || loadingUnits}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingUnits ? "Cargando..." : "Unidad"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units?.filter(u => u.type === 'LENGTH').map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Alto */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="heightValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Alto <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="150"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heightUnitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Unidad alto <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isLoading || loadingUnits}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingUnits ? "Cargando..." : "Unidad"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units?.filter(u => u.type === 'LENGTH').map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Largo */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lengthValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Largo <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="120"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lengthUnitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Unidad largo <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isLoading || loadingUnits}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingUnits ? "Cargando..." : "Unidad"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units?.filter(u => u.type === 'LENGTH').map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        {/* Unidad de medida (solo para MATERIAL) */}
        {kind === 'MATERIAL' && (
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
                      <SelectValue placeholder={loadingUnits ? "Cargando unidades..." : "Selecciona una unidad"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {units?.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} ({unit.abbreviation})
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
          <>
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

            {/* Categoría */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría (opcional)</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading || loadingCategories}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCategories ? "Cargando categorías..." : "Selecciona una categoría"} />
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
                    Selecciona la categoría del material
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Moneda y Valor Monetario */}
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
                      <SelectValue placeholder={loadingCurrencies ? "Cargando..." : "Selecciona moneda"} />
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
                    placeholder="0.00" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    disabled={isLoading}
                    className="font-mono"
                  />
                </FormControl>
                <FormDescription>
                  Formato: 10.50 (sin separadores de miles)
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
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

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
