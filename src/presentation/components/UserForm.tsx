"use client";

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
import { USER_ROLES, USER_STATUS } from "@/shared/constants";
import { Loader2 } from "lucide-react";

interface UserFormProps {
  onSubmit: (data: CreateUserInput) => Promise<void>;
  onCancel?: () => void;
  defaultValues?: Partial<CreateUserInput>;
  isLoading?: boolean;
}

export function UserForm({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading = false,
}: UserFormProps) {
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      lastName: defaultValues?.lastName || "",
      email: defaultValues?.email || "",
      rut: defaultValues?.rut || "",
      phone: defaultValues?.phone || "",
      role: defaultValues?.role || USER_ROLES.SUPERVISOR,
      status: defaultValues?.status || USER_STATUS.HABILITADO,
      areas: defaultValues?.areas || [],
      warehouses: defaultValues?.warehouses || [],
      tenantId: defaultValues?.tenantId || "kreatech-demo",
    },
  });

  const handleSubmit = async (data: CreateUserInput) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error("Error al enviar formulario:", error);
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
                <Input
                  type="email"
                  placeholder="juan.perez@kreatech.cl"
                  {...field}
                  disabled={isLoading}
                  className="h-10"
                />
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
                  placeholder="12345678-9"
                  {...field}
                  disabled={isLoading}
                  className="h-10"
                />
              </FormControl>
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
              <FormLabel>Teléfono (opcional)</FormLabel>
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
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={USER_ROLES.ADMIN}>Administrador</SelectItem>
                  <SelectItem value={USER_ROLES.JEFE}>Jefe</SelectItem>
                  <SelectItem value={USER_ROLES.SUPERVISOR}>Supervisor</SelectItem>
                </SelectContent>
              </Select>
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
