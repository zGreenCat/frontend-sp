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
import { useAreas } from "@/hooks/useAreas";
import { useUsers } from "@/hooks/useUsers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";

interface WarehouseFormProps {
  onSubmit: (data: CreateWarehouseInput) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<CreateWarehouseInput>;
  isLoading?: boolean;
  mode?: "create" | "edit";
  onAssignmentsSelected?: (assignments: {
    areaId?: string;
    supervisorId?: string;
  }) => void;
}

export function WarehouseForm({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading = false,
  mode = "create",
  onAssignmentsSelected,
}: WarehouseFormProps) {
  const [selectedAreaId, setSelectedAreaId] = useState<string | undefined>();
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<
    string | undefined
  >();

  // Fetch areas and users for assignment selects
  const { data: areas = [], isLoading: areasLoading } = useAreas();
  const usersQuery = useUsers();
  const usersData = usersQuery.data;
  const users = Array.isArray(usersData) ? usersData : (usersData?.data || []);
  const usersLoading = usersQuery.isLoading;

  // Filter active areas
  const activeAreas = useMemo(
    () => areas.filter((area) => area.status === "ACTIVO"),
    [areas]
  );

  // Filter active supervisors
  const activeSupervisors = useMemo(
    () => users.filter((user) => user.role === "SUPERVISOR" && user.status === "HABILITADO"),
    [users]
  );

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
      
      // Notify parent about selected assignments (only in create mode)
      if (mode === "create" && onAssignmentsSelected) {
        onAssignmentsSelected({
          areaId: selectedAreaId,
          supervisorId: selectedSupervisorId,
        });
      }
      
      form.reset();
      setSelectedAreaId(undefined);
      setSelectedSupervisorId(undefined);
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

        {/* Asignaciones iniciales (solo en modo crear) */}
        {mode === "create" && (
          <div className="space-y-4 pt-2 border-t">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">
                Asignaciones iniciales (opcional)
              </h3>
              <p className="text-xs text-muted-foreground">
                Puedes asignar la bodega a un área y/o supervisor al momento de
                crearla
              </p>
            </div>

            {/* Select de Área */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Área asignada (opcional)
              </label>
              <Select
                value={selectedAreaId}
                onValueChange={setSelectedAreaId}
                disabled={isLoading || areasLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un área..." />
                </SelectTrigger>
                <SelectContent>
                  {activeAreas.length === 0 ? (
                    <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                      No hay áreas activas disponibles
                    </div>
                  ) : (
                    activeAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Solo se muestran áreas activas
              </p>
            </div>

            {/* Select de Supervisor */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Supervisor responsable (opcional)
              </label>
              <Select
                value={selectedSupervisorId}
                onValueChange={setSelectedSupervisorId}
                disabled={isLoading || usersLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un supervisor..." />
                </SelectTrigger>
                <SelectContent>
                  {activeSupervisors.length === 0 ? (
                    <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                      No hay supervisores activos disponibles
                    </div>
                  ) : (
                    activeSupervisors.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} {user.lastName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Solo se muestran usuarios con rol Supervisor activos
              </p>
            </div>
          </div>
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
