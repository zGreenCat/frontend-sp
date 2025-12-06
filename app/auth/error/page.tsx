"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");
  
  // Mapear errores específicos del backend
  const getErrorMessage = () => {
    if (message) return message;
    
    switch (error) {
      case "access_denied":
        return "Has cancelado el inicio de sesión con Google";
      case "server_error":
        return "Ha ocurrido un error en el servidor. Por favor, intenta nuevamente";
      case "unauthorized":
        return "No estás autorizado para acceder al sistema";
      case "email_not_registered":
        return "Tu email no está registrado en el sistema. Contacta al administrador";
      case "user_disabled":
        return "Tu cuenta ha sido deshabilitada. Contacta al administrador";
      case "invalid_token":
        return "Token de autenticación inválido o expirado";
      default:
        return "Error desconocido en la autenticación";
    }
  };
  
  const errorMessage = getErrorMessage();

  useEffect(() => {
    console.error("❌ Error en autenticación OAuth:", { error, message: errorMessage });
  }, [error, errorMessage]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-destructive/50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-destructive">
            Error de Autenticación
          </h1>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            {errorMessage}
          </p>

          {!["access_denied", "email_not_registered", "user_disabled"].includes(error || "") && (
            <div className="bg-secondary/30 rounded-lg p-4 text-sm text-left">
              <p className="font-semibold mb-2 text-foreground">Posibles causas:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {error === "server_error" && (
                  <>
                    <li>Error temporal del servidor</li>
                    <li>Problema de conexión con Google</li>
                    <li>Intenta nuevamente en unos momentos</li>
                  </>
                )}
                {error === "unauthorized" && (
                  <>
                    <li>Tu cuenta no tiene permisos</li>
                    <li>No estás registrado en el sistema</li>
                    <li>Contacta al administrador</li>
                  </>
                )}
                {!error || !["server_error", "unauthorized"].includes(error) && (
                  <>
                    <li>La sesión expiró durante el proceso</li>
                    <li>Problema temporal de conexión</li>
                    <li>Configuración OAuth incorrecta</li>
                  </>
                )}
              </ul>
            </div>
          )}
          
          {["email_not_registered", "user_disabled"].includes(error || "") && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm">
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                ℹ️ Necesitas contactar al administrador del sistema
              </p>
            </div>
          )}

          <Button
            onClick={() => router.push("/login")}
            className="w-full h-11 bg-primary text-primary-foreground"
          >
            Volver a Intentar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
