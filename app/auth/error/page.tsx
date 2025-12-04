"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get("message") || "Error desconocido en la autenticación";

  useEffect(() => {
    console.error("❌ Error en autenticación OAuth:", errorMessage);
  }, [errorMessage]);

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

          <div className="bg-secondary/30 rounded-lg p-4 text-sm text-left">
            <p className="font-semibold mb-2 text-foreground">Posibles causas:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Tu cuenta de Google no está autorizada</li>
              <li>La sesión expiró durante el proceso</li>
              <li>Problema temporal de conexión</li>
            </ul>
          </div>

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
