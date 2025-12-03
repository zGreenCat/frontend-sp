"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-border/50">
        <CardContent className="p-8 md:p-12">
          <div className="text-center space-y-6">
            {/* Número 404 grande */}
            <div className="relative">
              <h1 className="text-[120px] md:text-[180px] font-bold text-primary/10 leading-none select-none">
                404
              </h1>
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="h-16 w-16 md:h-24 md:w-24 text-primary/40 animate-pulse" />
              </div>
            </div>

            {/* Mensaje principal */}
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Página no encontrada
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto">
                Lo sentimos, la página que buscas no existe o ha sido movida.
              </p>
            </div>

            {/* Información adicional */}
            <div className="bg-secondary/30 rounded-lg p-4 text-sm text-muted-foreground max-w-md mx-auto">
              <p className="mb-2">Posibles razones:</p>
              <ul className="text-left list-disc list-inside space-y-1">
                <li>La URL fue escrita incorrectamente</li>
                <li>El enlace está desactualizado</li>
                <li>No tienes permisos para acceder a esta página</li>
              </ul>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="gap-2 h-11 px-6"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver atrás
              </Button>
              
              <Button
                onClick={() => router.push("/dashboard")}
                className="gap-2 h-11 px-6 bg-primary text-primary-foreground"
              >
                <Home className="h-4 w-4" />
                Ir al Dashboard
              </Button>
            </div>

            {/* Footer con ayuda */}
            <div className="pt-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                ¿Necesitas ayuda?{" "}
                <a
                  href="mailto:soporte@smartpack.cl"
                  className="text-primary hover:underline font-medium"
                >
                  Contacta a soporte
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
