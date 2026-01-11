"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithCode } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      console.log('═══════════════════════════════════════════════');
      console.log('🔄 GOOGLE CALLBACK - INICIANDO FLUJO');
      console.log('═══════════════════════════════════════════════');
      
      try {
        // Verificar si hay un error en los parámetros
        const errorParam = searchParams.get("error");
        const errorMessage = searchParams.get("message");
        
        if (errorParam) {
          console.error('❌ Error en callback:', errorParam, errorMessage);
          
          // Mapear errores comunes de OAuth
          let friendlyError = errorMessage || "Error al autenticar con Google";
          if (errorParam === "access_denied") {
            friendlyError = "Has cancelado el inicio de sesión con Google";
          }
          
          setError(friendlyError);
          setTimeout(() => router.push("/login"), 3000);
          return;
        }

        // Obtener el código de autorización
        const code = searchParams.get("code");
        
        if (!code) {
          console.error('❌ No se recibió código de autorización');
          setError("No se recibió código de autorización");
          setTimeout(() => router.push("/login"), 3000);
          return;
        }

        console.log('✅ Código recibido, intercambiando por tokens...');
        
        // Intercambiar código por tokens usando el hook
        await loginWithCode(code);
        
        console.log('✅ Autenticación completada exitosamente');
        
        router.push("/dashboard");
        
      } catch (err) {
        console.error("❌ Error en callback de Google:", err);
        setError("Error al completar la autenticación");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router, loginWithCode]);

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

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div className="text-xl font-semibold text-foreground">
            Procesando...
          </div>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
