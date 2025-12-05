"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission, Permission } from "@/shared/permissions";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
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

  // Verificar permisos si se requiere
  if (requiredPermission && user) {
    // Obtener el rol como string - puede venir como objeto o string
    let userRole: string;
    if (typeof user.role === 'string') {
      userRole = user.role;
    } else if (user.role && typeof user.role === 'object' && 'name' in user.role) {
      userRole = (user.role as any).name;
    } else {
      userRole = String(user.role);
    }
    
    // Mapear rol del backend al frontend si es necesario (JEFE_AREA -> JEFE)
    const ROLE_MAP: Record<string, string> = {
      'JEFE_AREA': 'JEFE',
      'BODEGUERO': 'SUPERVISOR',
    };
    const mappedRole = ROLE_MAP[userRole] || userRole;
    
    const hasAccess = hasPermission(mappedRole, requiredPermission);
    
    console.log('🔐 ProtectedRoute:', {
      originalRole: userRole,
      mappedRole,
      requiredPermission,
      hasAccess
    });
    
    if (!hasAccess) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold">Acceso Denegado</h2>
            <p className="text-muted-foreground">
              No tienes permisos para acceder a este módulo.
            </p>
            <Button onClick={() => router.push("/dashboard")} variant="default">
              Volver al Dashboard
            </Button>
          </div>
        </div>
      );
    }
  }

  // Usuario autenticado y con permisos, mostrar contenido
  return <>{children}</>;
}
