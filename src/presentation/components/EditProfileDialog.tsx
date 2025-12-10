"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useUpdateUserPhone } from "@/hooks/useUsers"; // 👈 importa tu hook de React Query

// Schema de validación para editar teléfono
const editPhoneSchema = z.object({
  phone: z
    .string()
    .regex(/^(\+?56)?[9]\d{8}$/, "Teléfono inválido (Ej: +56912345678)")
    .or(z.string().length(0)),
});

type EditPhoneInput = z.infer<typeof editPhoneSchema>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
}: EditProfileDialogProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const form = useForm<EditPhoneInput>({
    resolver: zodResolver(editPhoneSchema),
    defaultValues: {
      phone: user?.phone || "",
    },
  });

  // Mutación de React Query para actualizar el teléfono
  const { mutateAsync: updatePhone, isPending } = useUpdateUserPhone();

  // Mantener el form sincronizado cuando se abre el diálogo o cambia el user
  useEffect(() => {
    if (open && user) {
      form.reset({ phone: user.phone || "" });
    }
  }, [open, user, form]);

  const onSubmit = async (data: EditPhoneInput) => {
    if (!user) return;

    try {
      await updatePhone({
        userId: user.id,
        phone: data.phone.trim() || null,
      });

      // Si tu auth usa React Query, podrías confiar en la invalidación;
      // si no, este refreshUser asegura que el contexto se actualiza.
      await refreshUser();

      toast({
        title: "Perfil actualizado",
        description: "Tu teléfono se ha actualizado correctamente.",
      });

      onOpenChange(false);
      form.reset({ phone: data.phone });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const loading = isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Actualiza tu información de contacto
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
