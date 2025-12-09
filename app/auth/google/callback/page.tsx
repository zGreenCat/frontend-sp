"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/infrastructure/services/authService";
import { Loader2 } from "lucide-react";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      console.log('═══════════════════════════════════════════════');
      console.log('🔄 GOOGLE CALLBACK - INICIANDO FLUJO');
      console.log('═══════════════════════════════════════════════');
      
      // ✅ CRÍTICO: Limpiar localStorage ANTES de obtener el nuevo perfil
      // Esto previene conflictos entre datos antiguos y la nueva sesión OAuth
      if (typeof window !== 'undefined') {
        authService.clearUser();
        console.log('🧹 localStorage limpiado antes de procesar callback');
      }
      
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

        console.log('✅ Callback exitoso');
        console.log('📡 Paso 1: Obteniendo perfil con cookie httpOnly...');
        
        // El backend ya estableció la cookie httpOnly con el JWT
        // getProfile() enviará la cookie automáticamente y guardará el usuario
        const user = await authService.getProfile();
        
        console.log('✅ Paso 2: Usuario autenticado correctamente');
        console.log(`   Email: ${user.email}`);
        console.log(`   Nombre: ${user.firstName} ${user.lastName}`);
        
        console.log('📍 Paso 3: Redirigiendo a dashboard...');
        
        router.push("/dashboard");
        
      } catch (err) {
        console.error("❌ Error en callback de Google:", err);
        setError("Error al completar la autenticación");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

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
