"use client";

import { useState } from "react";
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
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { Loader2 } from "lucide-react";

// Schema de validación para editar teléfono
const editPhoneSchema = z.object({
  phone: z.string()
    .regex(/^(\+?56)?[9]\d{8}$/, 'Teléfono inválido (Ej: +56912345678)')
    .or(z.string().length(0)),
});

type EditPhoneInput = z.infer<typeof editPhoneSchema>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { user, refreshUser } = useAuth();
  const { userRepo } = useRepositories();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<EditPhoneInput>({
    resolver: zodResolver(editPhoneSchema),
    defaultValues: {
      phone: user?.phone || "",
    },
  });

  const onSubmit = async (data: EditPhoneInput) => {
    if (!user) return;

    setLoading(true);
    try {
      await userRepo.update(user.id, {
        phone: data.phone,
      }, user.tenantId);

      await refreshUser();

      toast({
        title: "Perfil actualizado",
        description: "Tu teléfono se ha actualizado correctamente.",
      });

      onOpenChange(false);
      form.reset({ phone: data.phone });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
