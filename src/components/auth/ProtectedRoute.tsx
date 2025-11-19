"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Guardar la ruta a la que intentaba acceder
      sessionStorage.setItem("redirectAfterLogin", pathname);
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (redirigirá)
  if (!isAuthenticated) {
    return null;
  }

  // Usuario autenticado, mostrar contenido
  return <>{children}</>;
}
