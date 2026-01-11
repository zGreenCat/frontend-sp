"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithCode } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleAuthSuccess = async () => {
      try {
        // Obtener el código de autorización de la URL
        const code = searchParams.get('code');
        
        if (!code) {
          console.error("❌ No se recibió código de autorización");
          setError("No se recibió código de autorización");
          setTimeout(() => router.push("/login"), 3000);
          return;
        }

        console.log("✅ Código recibido, intercambiando por tokens...");
        
        // Intercambiar código por tokens
        await loginWithCode(code);
        
        // Pequeña pausa para que el usuario vea el mensaje de éxito
        await new Promise(resolve => setTimeout(resolve, 500));
        
        router.push("/dashboard");
        
      } catch (err) {
        console.error("❌ Error en auth success:", err);
        setError("Error al completar la autenticación");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleAuthSuccess();
  }, [router, searchParams, loginWithCode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background">
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

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <AuthSuccessContent />
    </Suspense>
  );
}
