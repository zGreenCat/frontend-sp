"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, CreateUserInput } from "@/shared/schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect, type Option } from "@/components/ui/multi-select";
import { USER_ROLES, USER_STATUS, TENANT_ID, mapBackendRoleToFrontend } from "@/shared/constants";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserRole } from "@/domain/entities/User";

interface UserFormProps {
  onSubmit: (data: CreateUserInput) => Promise<void>;
  onCancel?: () => void;
  defaultValues?: Partial<CreateUserInput> & { id?: string };
  isLoading?: boolean;
}

export function UserForm({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading = false,
}: UserFormProps) {
  const { areaRepo, warehouseRepo, userRepo } = useRepositories();
  const { user: currentUser } = useAuth();
  const [areasOptions, setAreasOptions] = useState<Option[]>([]);
  const [warehousesOptions, setWarehousesOptions] = useState<Option[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);

  // Helper para extraer el rol del usuario correctamente
  const getUserRole = (): string => {
    if (!currentUser) return USER_ROLES.SUPERVISOR;
    
    if (typeof currentUser.role === 'string') {
      return currentUser.role;
    } else if (currentUser.role && typeof currentUser.role === 'object' && 'name' in currentUser.role) {
      return (currentUser.role as any).name;
    } else {
      return currentUser.roleId || USER_ROLES.SUPERVISOR;
    }
  };

  // Helper para extraer el rol de defaultValues (puede venir como string u objeto)
  const getDefaultRole = (): UserRole => {
    if (!defaultValues?.role) return USER_ROLES.SUPERVISOR;
    
    let backendRole: string;
    
    if (typeof defaultValues.role === 'string') {
      backendRole = defaultValues.role;
    } else if (typeof defaultValues.role === 'object' && 'name' in defaultValues.role) {
      backendRole = (defaultValues.role as any).name;
    } else {
      return USER_ROLES.SUPERVISOR;
    }
    
    const frontendRole = mapBackendRoleToFrontend(backendRole);
    return frontendRole as UserRole;
  };

  // Helper para formatear RUT con puntos y guión (Ej: 12.345.678-9)
  const formatRutValue = (rut: string): string => {
    if (!rut) return "";
    // Remover todo excepto números y K/k
    const clean = rut.replace(/[^0-9kK]/g, '');
    if (clean.length < 2) return clean;
    
    // Separar cuerpo y dígito verificador
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1).toUpperCase();
    
    // Formatear cuerpo con puntos cada 3 dígitos de derecha a izquierda
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${formattedBody}-${dv}`;
  };

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      lastName: defaultValues?.lastName || "",
      email: defaultValues?.email || "",
      rut: formatRutValue(defaultValues?.rut || ""),
      phone: defaultValues?.phone || "",
      role: getDefaultRole(),
      status: defaultValues?.status || USER_STATUS.HABILITADO,
      areas: defaultValues?.areas || [],
      warehouses: defaultValues?.warehouses || [],
      tenantId: defaultValues?.tenantId || TENANT_ID,
    },
  });

  useEffect(() => {
    loadOptions();
  }, []);

  // Actualizar formulario cuando cambien los defaultValues (modo edición)
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name || "",
        lastName: defaultValues.lastName || "",
        email: defaultValues.email || "",
        rut: formatRutValue(defaultValues.rut || ""),
        phone: defaultValues.phone || "",
        role: getDefaultRole(),
        status: defaultValues.status || USER_STATUS.HABILITADO,
        areas: defaultValues.areas || [],
        warehouses: defaultValues.warehouses || [],
        tenantId: defaultValues.tenantId || TENANT_ID,
      });
    }
  }, [defaultValues]);

  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      const [areas, warehouses] = await Promise.all([
        areaRepo.findAll(TENANT_ID),
        warehouseRepo.findAll(TENANT_ID),
      ]);

      const userRole = getUserRole();
      const userAreas = currentUser?.areas || [];

      // Si es Jefe de Área, solo puede ver/asignar sus propias áreas
      let filteredAreas = areas.filter(a => a.status === 'ACTIVO');
      if (userRole === USER_ROLES.JEFE && userAreas.length > 0) {
        filteredAreas = filteredAreas.filter(a => userAreas.includes(a.id));
      }

      setAreasOptions(
        filteredAreas.map(a => ({ label: a.name, value: a.id }))
      );

      // Filtrar bodegas según áreas permitidas para Jefe de Área
      let filteredWarehouses = warehouses.filter(w => w.status === 'ACTIVO');
      if (userRole === USER_ROLES.JEFE && userAreas.length > 0) {
        filteredWarehouses = filteredWarehouses.filter(w => 
          w.areaId && userAreas.includes(w.areaId)
        );
      }

      setWarehousesOptions(
        filteredWarehouses.map(w => ({ label: w.name, value: w.id }))
      );
    } catch (error) {
      console.error("Error al cargar opciones:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSubmit = async (data: CreateUserInput) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error("Error al enviar formulario:", error);
    }
  };

  // Determinar roles permitidos según el rol del usuario autenticado
  const getAllowedRoles = (): UserRole[] => {
    if (!currentUser) return [USER_ROLES.SUPERVISOR];

    const userRole = getUserRole();
    console.log('🔐 Current user role:', userRole);
    console.log('👤 Current user:', currentUser);

    switch (userRole) {
      case USER_ROLES.ADMIN:
      case 'ADMIN':
        return [USER_ROLES.ADMIN, USER_ROLES.JEFE, USER_ROLES.SUPERVISOR];
      case USER_ROLES.JEFE:
      case 'JEFE':
        return [USER_ROLES.SUPERVISOR];
      case USER_ROLES.SUPERVISOR:
      case 'SUPERVISOR':
        return [];
      default:
        return [USER_ROLES.SUPERVISOR];
    }
  };

  const allowedRoles = getAllowedRoles();
  const canCreateUsers = allowedRoles.length > 0;

  // Determinar descripción contextual del campo de rol
  const getRoleDescription = (): string => {
    if (!currentUser) return "";
    
    const userRole = getUserRole();

    if (userRole === USER_ROLES.JEFE || userRole === 'JEFE') {
      return "Como Jefe de Área, solo puedes crear usuarios con rol Supervisor";
    }
    return "Selecciona el rol del usuario según sus responsabilidades";
  };

  // Validación asíncrona de email único
  const validateEmailUnique = async (email: string): Promise<string | true> => {
    if (!email) return true;
    
    setEmailCheckLoading(true);
    try {
      const exists = await userRepo.checkEmailExists(
        email, 
        TENANT_ID, 
        defaultValues?.id // Excluir el ID actual en modo edición
      );
      
      if (exists) {
        return "Este email ya está registrado en el sistema";
      }
      return true;
    } catch (error) {
      console.error("Error validando email:", error);
      return true; // No bloquear si hay error de red
    } finally {
      setEmailCheckLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Nombre */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input
                  placeholder="Juan"
                  {...field}
                  disabled={isLoading}
                  className="h-10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Apellido */}
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apellido</FormLabel>
              <FormControl>
                <Input
                  placeholder="Pérez"
                  {...field}
                  disabled={isLoading}
                  className="h-10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="juan.perez@kreatech.cl"
                    {...field}
                    disabled={isLoading}
                    className="h-10"
                    onBlur={async (e) => {
                      field.onBlur();
                      const result = await validateEmailUnique(e.target.value);
                      if (result !== true) {
                        form.setError("email", { 
                          type: "manual", 
                          message: result 
                        });
                      } else {
                        form.clearErrors("email");
                      }
                    }}
                  />
                  {emailCheckLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* RUT */}
        <FormField
          control={form.control}
          name="rut"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RUT</FormLabel>
              <FormControl>
                <Input
                  placeholder="12.345.678-9"
                  {...field}
                  onChange={(e) => {
                    // Formatear RUT automáticamente mientras escribe
                    const formatted = formatRutValue(e.target.value);
                    field.onChange(formatted);
                  }}
                  disabled={isLoading}
                  className="h-10"
                  maxLength={12}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Formato: 12.345.678-9 (con puntos y guión)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Teléfono */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input
                  placeholder="+56912345678"
                  {...field}
                  disabled={isLoading}
                  className="h-10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Rol */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading || !canCreateUsers || !!defaultValues}
              >
                <FormControl>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {allowedRoles.includes(USER_ROLES.ADMIN) && (
                    <SelectItem value={USER_ROLES.ADMIN}>Administrador</SelectItem>
                  )}
                  {allowedRoles.includes(USER_ROLES.JEFE) && (
                    <SelectItem value={USER_ROLES.JEFE}>Jefe de Área</SelectItem>
                  )}
                  {allowedRoles.includes(USER_ROLES.SUPERVISOR) && (
                    <SelectItem value={USER_ROLES.SUPERVISOR}>Supervisor</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {defaultValues ? (
                <FormDescription className="text-xs text-amber-600">
                  ⚠️ El rol no se puede modificar después de la creación
                </FormDescription>
              ) : getRoleDescription() ? (
                <FormDescription className="text-xs text-muted-foreground">
                  {getRoleDescription()}
                </FormDescription>
              ) : null}
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
              <FormLabel>Estado</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={USER_STATUS.HABILITADO}>Habilitado</SelectItem>
                  <SelectItem value={USER_STATUS.DESHABILITADO}>Deshabilitado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Áreas */}
        <FormField
          control={form.control}
          name="areas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Áreas Asignadas</FormLabel>
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
                    placeholder="Selecciona áreas"
                    disabled={isLoading}
                    className="w-full"
                  />
                )}
              </FormControl>
              {!loadingOptions && (
                <FormDescription className="text-xs text-muted-foreground">
                  Asigna una o más áreas al usuario según su rol
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bodegas */}
        <FormField
          control={form.control}
          name="warehouses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bodegas Asignadas</FormLabel>
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
                    placeholder="Selecciona bodegas"
                    disabled={isLoading}
                    className="w-full"
                  />
                )}
              </FormControl>
              {!loadingOptions && (
                <FormDescription className="text-xs text-muted-foreground">
                  Asigna bodegas específicas para Supervisores
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

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
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-10 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Usuario"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
