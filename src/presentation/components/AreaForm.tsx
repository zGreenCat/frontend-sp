"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { createAreaSchema, CreateAreaInput } from "@/shared/schemas";
import { TENANT_ID } from "@/shared/constants";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { Area } from "@/domain/entities/Area";
import { Loader2, Save, X } from "lucide-react";

interface AreaFormProps {
  onSubmit: (data: CreateAreaInput) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<CreateAreaInput> & { id?: string };
  isLoading?: boolean;
}

interface Option {
  label: string;
  value: string;
}

export function AreaForm({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading = false,
}: AreaFormProps) {
  const { areaRepo } = useRepositories();
  const [parentAreasOptions, setParentAreasOptions] = useState<Option[]>([]);
  const [allAreas, setAllAreas] = useState<Area[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState<string>(
    defaultValues?.level === 0 
      ? "principal" 
      : defaultValues?.level !== undefined && defaultValues.level > 0 
        ? "dependiente" 
        : ""
  );

  const form = useForm<CreateAreaInput>({
    resolver: zodResolver(createAreaSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      level: defaultValues?.level ?? 0, // Backend usa 0 para principal
      parentId: defaultValues?.parentId || undefined,
      status: defaultValues?.status || "ACTIVO",
      tenantId: defaultValues?.tenantId || TENANT_ID,
    },
  });

  useEffect(() => {
    loadParentAreas();
  }, []);

  // Actualizar formulario cuando cambien los defaultValues (modo edición)
  useEffect(() => {
    if (defaultValues) {
      const nodeType = defaultValues.level === 0 
        ? "principal" 
        : defaultValues.level !== undefined && defaultValues.level > 0 
          ? "dependiente" 
          : "";
      
      setSelectedNodeType(nodeType);
      
      form.reset({
        name: defaultValues.name || "",
        level: defaultValues.level ?? 0, // Backend usa 0 para principal
        parentId: defaultValues.parentId || undefined,
        status: defaultValues.status || "ACTIVO",
        tenantId: defaultValues.tenantId || TENANT_ID,
      });
    }
  }, [defaultValues]);

  const loadParentAreas = async () => {
    setLoadingOptions(true);
    try {
      const areas = await areaRepo.findAll(TENANT_ID);
      setAllAreas(areas);
      
      // Filtrar solo áreas activas y excluir el área actual en modo edición
      let filteredAreas = areas.filter(a => a.status === 'ACTIVO');
      if (defaultValues?.id) {
        filteredAreas = filteredAreas.filter(a => a.id !== defaultValues.id);
      }

      setParentAreasOptions(
        filteredAreas.map(a => ({ 
          label: `${a.name} (Nivel ${a.level + 1})`, // Mostrar nivel visual: backend + 1
          value: a.id 
        }))
      );
    } catch (error) {
      console.error("Error al cargar áreas padre:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleNodeTypeChange = (value: string) => {
    setSelectedNodeType(value);
    
    if (value === "principal") {
      form.setValue("level", 0); // Backend: nivel 0 = principal
      form.setValue("parentId", undefined);
    } else if (value === "dependiente") {
      // No establecer level aquí, esperar a que se seleccione el padre
      // Si ya hay un parentId seleccionado, mantenerlo
      const currentParentId = form.getValues("parentId");
      if (currentParentId) {
        handleParentChange(currentParentId);
      } else {
        // Limpiar parentId si estaba establecido
        form.setValue("parentId", undefined);
      }
    }
  };

  const handleParentChange = (parentId: string) => {
    form.setValue("parentId", parentId);
    
    // Calcular nivel automáticamente: nivel del padre + 1
    const parentArea = allAreas.find(a => a.id === parentId);
    if (parentArea) {
      form.setValue("level", parentArea.level + 1);
    }
  };

  const handleSubmit = async (data: CreateAreaInput) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error("Error al enviar formulario:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        {/* Nombre */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Área</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Producción, Logística, Ventas"
                  {...field}
                  disabled={isLoading}
                  className="h-10"
                />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground">
                Nombre descriptivo para identificar el área
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo de Nodo */}
        <FormItem>
          <FormLabel>Tipo de Área</FormLabel>
          <Select
            onValueChange={handleNodeTypeChange}
            value={selectedNodeType}
            disabled={isLoading}
          >
            <FormControl>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Selecciona el tipo de área" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="principal">
                 Principal (Área raíz, sin dependencia)
              </SelectItem>
              <SelectItem value="dependiente">
                 Dependiente (Subárea de otra área)
              </SelectItem>
            </SelectContent>
          </Select>
          <FormDescription className="text-xs text-muted-foreground">
            Las áreas principales son independientes, las dependientes pertenecen a un área padre
          </FormDescription>
        </FormItem>

        {/* Área Padre (solo si es Dependiente) */}
        {selectedNodeType === "dependiente" && (
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área Padre *</FormLabel>
                <FormControl>
                  {loadingOptions ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : (
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleParentChange(value);
                      }}
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecciona el área padre" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {parentAreasOptions.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground text-center">
                            No hay áreas disponibles
                          </div>
                        ) : (
                          parentAreasOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </FormControl>
                <FormDescription className="text-xs text-muted-foreground">
                  Selecciona el área de la cual depende esta subárea. El nivel se asignará automáticamente.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Estado */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="INACTIVO"> Inactivo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Información adicional */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 text-sm text-blue-900 dark:text-blue-200">
          <p className="font-medium mb-1">Información:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>El nivel se asignará automáticamente según la jerarquía</li>
            <li>Las áreas principales tienen nivel 1</li>
            <li>Las áreas dependientes heredan el nivel del padre + 1</li>
          </ul>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 h-10"
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-10"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {defaultValues?.id ? "Actualizar" : "Crear"} Área
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
