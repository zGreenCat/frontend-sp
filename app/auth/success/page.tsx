"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/infrastructure/services/authService";
import { Loader2 } from "lucide-react";

export default function AuthSuccessPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleAuthSuccess();
  }, []);

  const handleAuthSuccess = async () => {
    console.log('═══════════════════════════════════════════════');
    console.log('🔄 AUTH SUCCESS - INICIANDO FLUJO');
    console.log('═══════════════════════════════════════════════');
    
    try {
      console.log('📡 Paso 1: Obteniendo perfil con cookie httpOnly...');
      
      // El backend ya estableció la cookie httpOnly con el JWT
      // getProfile() enviará la cookie automáticamente y guardará el usuario
      const user = await authService.getProfile();
      
      console.log('✅ Paso 2: Usuario autenticado correctamente');
      console.log(`   Email: ${user.email}`);
      console.log(`   Nombre: ${user.firstName} ${user.lastName}`);
      
      console.log('📍 Paso 3: Redirigiendo a dashboard...');
      
      // Pequeña pausa para que el usuario vea el mensaje de éxito
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.push("/dashboard");
      
    } catch (err) {
      console.error("❌ Error en auth success:", err);
      setError("Error al completar la autenticación");
      setTimeout(() => router.push("/login"), 3000);
    }
  };

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
