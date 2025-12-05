"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateUserInput, createUserSchema } from "@/shared/schemas";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage, FormDescription } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { USER_ROLES, TENANT_ID } from "@/shared/constants";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { useAuth } from "@/hooks/use-auth";

interface UserFormStepperProps {
  onSubmit: (data: CreateUserInput) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<CreateUserInput>;
  isLoading?: boolean;
}

const STEPS = [
  { id: 1, title: "Información Personal", description: "Datos básicos del usuario" },
  { id: 2, title: "Contacto", description: "Email y teléfono" },
  { id: 3, title: "Rol y Permisos", description: "Asignación de rol" },
];

export function UserFormStepper({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading = false,
}: UserFormStepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isShaking, setIsShaking] = useState(false);
  const [areaOptions, setAreaOptions] = useState<Option[]>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<Option[]>([]);
  const { areaRepo, warehouseRepo } = useRepositories();
  const { user: currentUser } = useAuth();

  // Detectar si el usuario actual es JEFE
  const isJefeArea = useMemo(() => {
    if (!currentUser) return false;
    const userRole = typeof currentUser.role === 'string' ? currentUser.role : (currentUser.role as any)?.name || '';
    const ROLE_MAP: Record<string, string> = {
      'JEFE_AREA': 'JEFE',
      'BODEGUERO': 'SUPERVISOR',
    };
    const mappedRole = ROLE_MAP[userRole] || userRole;
    return mappedRole === 'JEFE';
  }, [currentUser]);

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      lastName: defaultValues?.lastName || "",
      email: defaultValues?.email || "",
      rut: defaultValues?.rut || "",
      phone: defaultValues?.phone || "",
      // Si es JEFE, el rol por defecto debe ser SUPERVISOR
      role: isJefeArea ? USER_ROLES.SUPERVISOR : (defaultValues?.role || USER_ROLES.SUPERVISOR),
      status: defaultValues?.status || "HABILITADO",
      areas: defaultValues?.areas || [],
      warehouses: defaultValues?.warehouses || [],
      tenantId: defaultValues?.tenantId || TENANT_ID,
    },
  });

  // Cargar áreas y bodegas según el rol del usuario
  useEffect(() => {
    const loadOptions = async () => {
      try {
        if (!currentUser) return;
        
        // Detectar si es JEFE
        const userRole = typeof currentUser.role === 'string' ? currentUser.role : (currentUser.role as any)?.name || '';
        const ROLE_MAP: Record<string, string> = {
          'JEFE_AREA': 'JEFE',
          'BODEGUERO': 'SUPERVISOR',
        };
        const mappedRole = ROLE_MAP[userRole] || userRole;
        
        console.log('🔍 Loading options - User role:', userRole, '-> Mapped:', mappedRole);
        
        // Si es JEFE, cargar solo sus áreas y bodegas
        if (mappedRole === 'JEFE') {
          // Obtener IDs de áreas del usuario
          const userAreaIds = (currentUser.areas || []).map(a => 
            typeof a === 'string' ? a : (a as any).id
          );
          
          console.log('📍 JEFE area IDs:', userAreaIds);
          
          // Cargar todas las áreas primero
          const allAreas = await areaRepo.findAll(TENANT_ID);
          const filteredAreas = allAreas.filter(a => userAreaIds.includes(a.id));
          
          console.log('🏢 Loading warehouses from area details...');
          
          // Cargar detalles de cada área para obtener sus bodegas
          const areaDetailsPromises = userAreaIds.map(async (areaId) => {
            try {
              const areaDetail = await (areaRepo as any).findByIdWithDetails(areaId);
              console.log(`📦 Area "${areaDetail?.area?.name}":`, areaDetail?.warehouses?.length || 0, 'warehouses');
              return areaDetail?.warehouses || [];
            } catch (error) {
              console.error(`Error loading warehouses for area ${areaId}:`, error);
              return [];
            }
          });
          
          const warehousesByArea = await Promise.all(areaDetailsPromises);
          
          // Combinar todas las bodegas y eliminar duplicados
          const allWarehouses = warehousesByArea.flat();
          const uniqueWarehouses = Array.from(
            new Map(allWarehouses.map(w => [w.id, w])).values()
          );
          
          console.log('✅ Total warehouses for JEFE:', uniqueWarehouses.length);
          
          setAreaOptions(filteredAreas.map(a => ({ label: a.name, value: a.id })));
          setWarehouseOptions(uniqueWarehouses.map(w => ({ label: w.name, value: w.id })));
        } else {
          // Admin ve todo
          const [areas, warehouses] = await Promise.all([
            areaRepo.findAll(TENANT_ID),
            warehouseRepo.findAll(TENANT_ID),
          ]);
          
          setAreaOptions(areas.map(a => ({ label: a.name, value: a.id })));
          setWarehouseOptions(warehouses.map(w => ({ label: w.name, value: w.id })));
        }
      } catch (error) {
        console.error('Error loading areas/warehouses:', error);
      }
    };
    loadOptions();
  }, [currentUser]);

  const handleNext = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    console.log('🔄 Avanzando del paso', currentStep, 'al paso', currentStep + 1);
    
    let fieldsToValidate: (keyof CreateUserInput)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ["name", "lastName", "rut"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["email", "phone"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    console.log('✅ Validación paso', currentStep, ':', isValid);
    
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      console.log('✅ Avanzado al paso:', currentStep + 1);
    } else if (!isValid) {
      // Activar animación de shake
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFormSubmit = form.handleSubmit(async (data) => {
    console.log('📝 Submitting form - Current step:', currentStep);
    
    // Solo enviar si estamos en el último paso
    if (currentStep !== STEPS.length) {
      console.log('⚠️ No estamos en el último paso, cancelando submit');
      return;
    }
    
    console.log('✅ Creando usuario con datos:', data);
    // Asegurar que tenantId esté presente
    const dataWithTenant = {
      ...data,
      tenantId: data.tenantId || TENANT_ID,
    };
    await onSubmit(dataWithTenant);
  });

  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  currentStep === step.id && "border-primary bg-primary text-primary-foreground",
                  currentStep > step.id && "border-green-500 bg-green-500 text-white",
                  currentStep < step.id && "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p className={cn(
                  "text-xs font-medium",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-[2px] flex-1 mx-2 transition-all",
                  currentStep > step.id ? "bg-green-500" : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* Step 1: Información Personal */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Label>Nombre</Label>
                    <FormControl>
                      <Input
                        placeholder="Juan"
                        {...field}
                        disabled={isLoading}
                        className={cn(fieldState.error && "border-destructive focus-visible:ring-destructive")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Label>Apellido</Label>
                    <FormControl>
                      <Input
                        placeholder="Pérez"
                        {...field}
                        disabled={isLoading}
                        className={cn(fieldState.error && "border-destructive focus-visible:ring-destructive")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rut"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Label>RUT</Label>
                    <FormControl>
                      <Input
                        placeholder="12.345.678-9"
                        {...field}
                        disabled={isLoading}
                        className={cn(fieldState.error && "border-destructive focus-visible:ring-destructive")}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Formato: 12.345.678-9 (con puntos y guión)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 2: Contacto */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Label>Email</Label>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="usuario@empresa.com"
                        {...field}
                        disabled={isLoading}
                        className={cn(fieldState.error && "border-destructive focus-visible:ring-destructive")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Label>Teléfono</Label>
                    <FormControl>
                      <Input
                        placeholder="+56912345678"
                        {...field}
                        disabled={isLoading}
                        className={cn(fieldState.error && "border-destructive focus-visible:ring-destructive")}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Incluye código de país (ej: +56 para Chile)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 3: Rol y Asignaciones */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <Label>Rol del Usuario</Label>
                    {isJefeArea ? (
                      /* JEFE solo puede crear SUPERVISOR - Campo de solo lectura */
                      <>
                        <Input 
                          value="Supervisor" 
                          disabled 
                          className="bg-muted cursor-not-allowed"
                        />
                        <FormDescription className="text-xs">
                          Como Jefe de Área, solo puedes crear usuarios Supervisores
                        </FormDescription>
                      </>
                    ) : (
                      /* Admin puede seleccionar cualquier rol */
                      <>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={USER_ROLES.ADMIN}>Administrador</SelectItem>
                            <SelectItem value={USER_ROLES.JEFE}>Jefe de Área</SelectItem>
                            <SelectItem value={USER_ROLES.SUPERVISOR}>Supervisor</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          Define los permisos y accesos del usuario
                        </FormDescription>
                      </>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Asignaciones según el rol */}
              {form.watch("role") === USER_ROLES.JEFE && (
                <FormField
                  control={form.control}
                  name="areas"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Áreas Asignadas</Label>
                      <FormControl>
                        <MultiSelect
                          options={areaOptions}
                          selected={field.value || []}
                          onChange={field.onChange}
                          placeholder="Selecciona las áreas..."
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        El jefe de área podrá gestionar estas áreas y sus bodegas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch("role") === USER_ROLES.SUPERVISOR && (
                <FormField
                  control={form.control}
                  name="warehouses"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Bodegas Asignadas</Label>
                      <FormControl>
                        <MultiSelect
                          options={warehouseOptions}
                          selected={field.value || []}
                          onChange={field.onChange}
                          placeholder="Selecciona las bodegas..."
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        El supervisor podrá gestionar únicamente estas bodegas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Resumen de datos */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-foreground">Resumen del Usuario</p>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p><span className="font-medium">Nombre:</span> {form.watch("name")} {form.watch("lastName")}</p>
                  <p><span className="font-medium">RUT:</span> {form.watch("rut")}</p>
                  <p><span className="font-medium">Email:</span> {form.watch("email")}</p>
                  <p><span className="font-medium">Teléfono:</span> {form.watch("phone")}</p>
                  <p><span className="font-medium">Rol:</span> {
                    form.watch("role") === USER_ROLES.ADMIN ? "Administrador" :
                    form.watch("role") === USER_ROLES.JEFE ? "Jefe de Área" : "Supervisor"
                  }</p>
                  {form.watch("role") === USER_ROLES.JEFE && form.watch("areas")?.length > 0 && (
                    <p><span className="font-medium">Áreas:</span> {form.watch("areas").length} asignada(s)</p>
                  )}
                  {form.watch("role") === USER_ROLES.SUPERVISOR && form.watch("warehouses")?.length > 0 && (
                    <p><span className="font-medium">Bodegas:</span> {form.watch("warehouses").length} asignada(s)</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
            )}
            
            <div className="flex-1" />

            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className={cn(
                  "gap-2 transition-all",
                  isShaking && "animate-[shake_0.5s_ease-in-out]"
                )}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Crear Usuario
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
