"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateUserInput, createUserSchema } from "@/shared/schemas";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage, FormDescription } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { USER_ROLES, TENANT_ID } from "@/shared/constants";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      lastName: defaultValues?.lastName || "",
      email: defaultValues?.email || "",
      rut: defaultValues?.rut || "",
      phone: defaultValues?.phone || "",
      role: defaultValues?.role || USER_ROLES.SUPERVISOR,
      status: defaultValues?.status || "HABILITADO",
      areas: defaultValues?.areas || [],
      warehouses: defaultValues?.warehouses || [],
      tenantId: defaultValues?.tenantId || TENANT_ID,
    },
  });

  const handleNext = async () => {
    let fieldsToValidate: (keyof CreateUserInput)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ["name", "lastName", "rut"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["email", "phone"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
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

          {/* Step 3: Rol */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <Label>Rol</Label>
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
                        <SelectItem value={USER_ROLES.JEFE}>Jefe</SelectItem>
                        <SelectItem value={USER_ROLES.SUPERVISOR}>Supervisor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Define los permisos y accesos del usuario
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Resumen de datos */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-foreground">Resumen</p>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p><span className="font-medium">Nombre:</span> {form.watch("name")} {form.watch("lastName")}</p>
                  <p><span className="font-medium">RUT:</span> {form.watch("rut")}</p>
                  <p><span className="font-medium">Email:</span> {form.watch("email")}</p>
                  <p><span className="font-medium">Teléfono:</span> {form.watch("phone")}</p>
                  <p><span className="font-medium">Rol:</span> {
                    form.watch("role") === USER_ROLES.ADMIN ? "Administrador" :
                    form.watch("role") === USER_ROLES.JEFE ? "Jefe" : "Supervisor"
                  }</p>
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
