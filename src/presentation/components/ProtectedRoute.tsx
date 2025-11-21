"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  fallbackPath?: string;
}

/**
 * Componente para proteger rutas basado en permisos del usuario
 * Si el usuario no tiene el permiso requerido, es redirigido a una página alternativa
 */
export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  fallbackPath = "/dashboard" 
}: ProtectedRouteProps) {
  const { user, isLoading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // No hacer nada mientras carga la información del usuario
    if (isLoading) return;

    // Si no hay usuario autenticado, redirigir al login
    if (!user) {
      router.push("/login");
      return;
    }

    // Si se especifica un permiso requerido, verificar que el usuario lo tenga
    if (requiredPermission && !hasPermission(requiredPermission)) {
      router.push(fallbackPath);
    }
  }, [user, isLoading, requiredPermission, fallbackPath, router, hasPermission]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, no renderizar nada (la redirección ya se hizo)
  if (!user) {
    return null;
  }

  // Si hay permiso requerido y el usuario no lo tiene, no renderizar nada
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  // Si todo está bien, renderizar los children
  return <>{children}</>;
}
