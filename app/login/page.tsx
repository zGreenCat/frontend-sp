"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/presentation/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Mock login - cualquier credencial funciona
      await login("user@kreatech.cl", "password");
      
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente",
      });
      
      router.push("/dashboard");
    } catch {
      toast({
        title: "Error",
        description: "Error al iniciar sesión",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="mx-auto h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mb-2">
            <span className="text-primary-foreground font-bold text-2xl">K</span>
          </div>
          <CardTitle className="text-3xl font-bold">Smart Packaging</CardTitle>
          <CardDescription className="text-base">
            Tecnología para el futuro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión con Google"
            )}
          </Button>
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            variant="outline"
            className="w-full h-12 border-2 text-base font-medium"
          >
            Iniciar sesión con Microsoft
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
