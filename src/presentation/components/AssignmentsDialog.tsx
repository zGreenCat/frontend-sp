"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, MapPin, Warehouse, History } from "lucide-react";
import { MultiSelect, type Option } from "@/components/ui/multi-select";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { User } from "@/domain/entities/User";
import { TENANT_ID, USER_ROLES } from "@/shared/constants";
import { useAuth } from "@/hooks/use-auth";
import { useAssignmentHistory } from "@/hooks/useAssignmentHistory";
import { AssignmentHistoryList } from "@/presentation/components/AssignmentHistoryList";

// Schema para asignaciones
const assignmentsSchema = z.object({
  areas: z.array(z.string()).default([]),
  warehouses: z.array(z.string()).default([]),
});

type AssignmentsInput = z.infer<typeof assignmentsSchema>;

interface AssignmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AssignmentsInput) => Promise<void>;
  user: User;
  isLoading?: boolean;
}

export function AssignmentsDialog({
  open,
  onOpenChange,
  onSubmit,
  user,
  isLoading = false,
}: AssignmentsDialogProps) {
  const { areaRepo, warehouseRepo } = useRepositories();
  const { user: currentUser } = useAuth();

  const [areasOptions, setAreasOptions] = useState<Option[]>([]);
  const [warehousesOptions, setWarehousesOptions] = useState<Option[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const form = useForm<AssignmentsInput>({
    resolver: zodResolver(assignmentsSchema),
    defaultValues: {
      areas: user.areas || [],
      warehouses: user.warehouses || [],
    },
  });

  // Hook para cargar historial de asignaciones
  const { data: historyData, isLoading: loadingHistory } = useAssignmentHistory(user.id);
  const assignmentHistory = historyData?.data || [];

  // Helper para extraer el rol del usuario actual correctamente
  const getUserRole = (): string => {
    if (!currentUser) return USER_ROLES.SUPERVISOR;

    if (typeof currentUser.role === "string") {
      return currentUser.role;
    } else if (
      currentUser.role &&
      typeof currentUser.role === "object" &&
      "name" in currentUser.role
    ) {
      return (currentUser.role as any).name;
    } else {
      return (currentUser as any).roleId || USER_ROLES.SUPERVISOR;
    }
  };

  useEffect(() => {
    if (open) {
      loadOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      const [areas, warehouses] = await Promise.all([
        areaRepo.findAll(TENANT_ID),
        warehouseRepo.findAll(TENANT_ID),
      ]);

      const userRole = getUserRole();
      const userAreas = currentUser?.areas || [];
      const userAreaIds = userAreas.map((a: any) =>
        typeof a === "string" ? a : a.id
      );

      // ÁREAS ───────────────────────────────────────────
      let filteredAreas = areas.filter((a) => a.status === "ACTIVO");
      if (userRole === USER_ROLES.JEFE && userAreaIds.length > 0) {
        filteredAreas = filteredAreas.filter((a) => userAreaIds.includes(a.id));
      }

      const areaOptionsMap = new Map<string, { label: string; value: string }>();

      filteredAreas.forEach((a) => {
        areaOptionsMap.set(a.id, { label: a.name, value: a.id });
      });

      const userAssignedAreas = user.areaDetails || [];
      userAssignedAreas.forEach((userArea) => {
        if (!areaOptionsMap.has(userArea.id)) {
          areaOptionsMap.set(userArea.id, {
            label: userArea.name,
            value: userArea.id,
          });
        }
      });

      setAreasOptions(Array.from(areaOptionsMap.values()));

      // BODEGAS ─────────────────────────────────────────
      const userToEditRole =
        typeof user.role === "string"
          ? user.role
          : (user.role as any)?.name || "";
      const isEditingSupervisor =
        userToEditRole === "SUPERVISOR" ||
        userToEditRole === USER_ROLES.SUPERVISOR;

      let filteredWarehouses = warehouses.filter(
        (w) => w.status === "ACTIVO"
      );

      if (
        userRole === USER_ROLES.JEFE &&
        userAreaIds.length > 0 &&
        !isEditingSupervisor
      ) {
        filteredWarehouses = filteredWarehouses.filter(
          (w: any) => w.areaId && userAreaIds.includes(w.areaId)
        );
      }

      const warehouseOptionsMap = new Map<
        string,
        { label: string; value: string }
      >();

      filteredWarehouses.forEach((w: any) => {
        warehouseOptionsMap.set(w.id, { label: w.name, value: w.id });
      });

      const userAssignedWarehouses = user.warehouseDetails || [];
      userAssignedWarehouses.forEach((userWarehouse) => {
        if (!warehouseOptionsMap.has(userWarehouse.id)) {
          warehouseOptionsMap.set(userWarehouse.id, {
            label: userWarehouse.name,
            value: userWarehouse.id,
          });
        }
      });

      setWarehousesOptions(Array.from(warehouseOptionsMap.values()));

      // Resetear valores del form
      form.reset({
        areas: user.areas || [],
        warehouses: user.warehouses || [],
      });
    } catch (error) {
      console.error("Error al cargar opciones:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSubmit = async (data: AssignmentsInput) => {
    await onSubmit(data);
  };

  // Rol del usuario que estamos editando
  const userRoleName =
    typeof user.role === "string"
      ? user.role
      : (user.role as any)?.name || "";

  const showAreas =
    userRoleName === "JEFE" ||
    userRoleName === "JEFE_AREA" ||
    userRoleName === USER_ROLES.JEFE;

  const showWarehouses =
    userRoleName === "SUPERVISOR" || userRoleName === USER_ROLES.SUPERVISOR;

  // Valores observados del formulario para usarlos en los useMemo
  const watchedAreas = form.watch("areas");
  const watchedWarehouses = form.watch("warehouses");

  // Mensaje de confirmación con resumen de cambios
  const confirmMessage = useMemo(() => {
    const currentAreasCount = user.areas?.length || 0;
    const newAreasCount = watchedAreas?.length || 0;
    const currentWarehousesCount = user.warehouses?.length || 0;
    const newWarehousesCount = watchedWarehouses?.length || 0;

    const changes: string[] = [];

    if (showAreas && newAreasCount !== currentAreasCount) {
      changes.push(
        `${newAreasCount} área${newAreasCount !== 1 ? "s" : ""}`
      );
    }

    if (showWarehouses && newWarehousesCount !== currentWarehousesCount) {
      changes.push(
        `${newWarehousesCount} bodega${
          newWarehousesCount !== 1 ? "s" : ""
        }`
      );
    }

    if (changes.length === 0) {
      return null;
    }

    return `Se asignarán ${changes.join(" y ")} a ${
      user.name
    } ${user.lastName}`;
  }, [
    watchedAreas,
    watchedWarehouses,
    user.areas,
    user.warehouses,
    user.name,
    user.lastName,
    showAreas,
    showWarehouses,
  ]);

  const hasChanges = useMemo(() => {
    const areasChanged =
      JSON.stringify(watchedAreas || []) !==
      JSON.stringify(user.areas || []);
    const warehousesChanged =
      JSON.stringify(watchedWarehouses || []) !==
      JSON.stringify(user.warehouses || []);

    return areasChanged || warehousesChanged;
  }, [watchedAreas, watchedWarehouses, user.areas, user.warehouses]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" />
            Modificar Asignaciones
          </DialogTitle>
          <DialogDescription>
            Gestiona las áreas y/o bodegas asignadas al usuario
          </DialogDescription>
        </DialogHeader>

        {/* Información del usuario */}
        <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">
                {user.name} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant="outline" className="text-sm">
              {userRoleName === "JEFE" ||
              userRoleName === "JEFE_AREA" ||
              userRoleName === USER_ROLES.JEFE
                ? "Jefe de Área"
                : userRoleName === "SUPERVISOR" ||
                  userRoleName === USER_ROLES.SUPERVISOR
                ? "Supervisor"
                : userRoleName === "ADMIN" ||
                  userRoleName === USER_ROLES.ADMIN
                ? "Administrador"
                : userRoleName}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="assignments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assignments">Asignaciones</TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Áreas - Solo para JEFE */}
            {showAreas && (
              <FormField
                control={form.control}
                name="areas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Áreas Asignadas
                    </FormLabel>
                    <FormControl>
                      {loadingOptions ? (
                        <div className="space-y-2">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ) : (
                        <MultiSelect
                          options={areasOptions}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder={
                            areasOptions.length > 0
                              ? `Haz clic para seleccionar (${areasOptions.length} disponibles)`
                              : "No hay áreas disponibles"
                          }
                          disabled={isLoading}
                          className="w-full"
                        />
                      )}
                    </FormControl>
                    {!loadingOptions && (
                      <FormDescription className="text-xs text-muted-foreground">
                        {field.value.length === 0
                          ? `⚠️ Este usuario no tiene áreas asignadas. ${areasOptions.length} áreas disponibles para seleccionar.`
                          : `${field.value.length} área${
                              field.value.length > 1 ? "s" : ""
                            } seleccionada${
                              field.value.length > 1 ? "s" : ""
                            }`}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Bodegas - Solo para SUPERVISOR */}
            {showWarehouses && (
              <FormField
                control={form.control}
                name="warehouses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-primary" />
                      Bodegas Asignadas
                    </FormLabel>
                    <FormControl>
                      {loadingOptions ? (
                        <div className="space-y-2">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ) : (
                        <MultiSelect
                          options={warehousesOptions}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder={
                            warehousesOptions.length > 0
                              ? `Haz clic para seleccionar (${warehousesOptions.length} disponibles)`
                              : "No hay bodegas disponibles"
                          }
                          disabled={isLoading}
                          className="w-full"
                        />
                      )}
                    </FormControl>
                    {!loadingOptions && (
                      <FormDescription className="text-xs text-muted-foreground">
                        {field.value.length === 0
                          ? `⚠️ Este usuario no tiene bodegas asignadas. ${warehousesOptions.length} bodegas disponibles para seleccionar.`
                          : `${field.value.length} bodega${
                              field.value.length > 1 ? "s" : ""
                            } seleccionada${
                              field.value.length > 1 ? "s" : ""
                            }`}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Información adicional si no hay campos disponibles */}
            {!showAreas && !showWarehouses && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Los usuarios con rol <strong>{user.role}</strong> no tienen
                  asignaciones de áreas ni bodegas.
                </p>
              </div>
            )}

            {/* Resumen de cambios */}
            {confirmMessage && hasChanges && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  📝 {confirmMessage}
                </p>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || loadingOptions || !hasChanges}
                className="flex-1 bg-primary text-primary-foreground"
                title={confirmMessage || undefined}
              >
                {isLoading ? "Guardando..." : "Guardar Asignaciones"}
              </Button>
            </div>
          </form>
        </Form>
          </TabsContent>

          <TabsContent value="history">
            <div className="py-4">
              <AssignmentHistoryList 
                entries={assignmentHistory} 
                isLoading={loadingHistory} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
