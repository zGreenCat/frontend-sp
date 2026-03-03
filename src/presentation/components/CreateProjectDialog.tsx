"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Loader2, Save, X } from "lucide-react";
import { createProjectFormSchema, CreateProjectFormInput } from "@/shared/schemas";
import { useCreateProject } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";
import { TENANT_ID } from "@/shared/constants";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreateProject();

  const form = useForm<CreateProjectFormInput>({
    resolver: zodResolver(createProjectFormSchema),
    defaultValues: {
      name: "",
      code: "",
    },
  });

  // Resetear form al abrir/cerrar
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data: CreateProjectFormInput) => {
    try {
      const created = await createMutation.mutateAsync({
        name: data.name,
        code: data.code,
      });

      toast({
        title: "✅ Proyecto creado",
        description: `El proyecto "${created.name}" (${created.code}) ha sido creado exitosamente.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      const message: string = error?.message || "";
      const statusCode: number = error?.statusCode ?? 0;

      // 409 Conflict → error de campo en code
      if (statusCode === 409 || message.toLowerCase().includes("already exists") || message.toLowerCase().includes("ya existe")) {
        form.setError("code", {
          type: "manual",
          message: "Este código ya está en uso. Elige uno diferente.",
        });
        return;
      }

      toast({
        title: "❌ Error al crear proyecto",
        description: message || "No se pudo crear el proyecto. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Nuevo Proyecto</DialogTitle>
          <DialogDescription>
            Crea un nuevo proyecto para gestionar asignaciones y productos.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-2">
            {/* Nombre */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Proyecto *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Proyecto Ampliación Planta Norte"
                      {...field}
                      disabled={createMutation.isPending}
                      className="h-11"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Nombre descriptivo del proyecto (2–120 caracteres)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Código */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: PRJ-2026-001"
                      {...field}
                      disabled={createMutation.isPending}
                      className="h-11 font-mono"
                      onBlur={(e) => {
                        // Normalizar al perder el foco: trim + uppercase + espacios→guiones
                        const normalized = e.target.value
                          .trim()
                          .toUpperCase()
                          .replace(/\s+/g, "-");
                        field.onChange(normalized);
                        field.onBlur();
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Identificador único. Se normaliza a mayúsculas automáticamente (2–50 caracteres)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createMutation.isPending}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 bg-primary text-primary-foreground"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Crear Proyecto
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
