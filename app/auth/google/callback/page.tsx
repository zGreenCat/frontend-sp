"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Verificar si hay un error en los parámetros
        const errorParam = searchParams.get("error");
        if (errorParam) {
          setError("Error al autenticar con Google");
          setTimeout(() => router.push("/login"), 3000);
          return;
        }

        // El backend ya estableció la cookie httpOnly con el JWT
        // Solo necesitamos refrescar el perfil del usuario
        await refreshUser();
        
        // Redirigir al dashboard
        router.push("/dashboard");
      } catch (err) {
        console.error("Error en callback de Google:", err);
        setError("Error al completar la autenticación");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, refreshUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <div className="text-destructive text-xl font-semibold">
              {error}
            </div>
            <p className="text-muted-foreground">
              Redirigiendo al login...
            </p>
          </>
        ) : (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div className="text-xl font-semibold text-foreground">
              Completando inicio de sesión...
            </div>
            <p className="text-muted-foreground">
              Por favor espera un momento
            </p>
          </>
        )}
      </div>
    </div>
  );
}
