"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginView() {
  const router = useRouter();

  const handleLogin = () => {
    // Mock login - redirect to dashboard
    router.push("/dashboard");
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
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-medium"
          >
            Iniciar sesión con Google
          </Button>
          <Button
            onClick={handleLogin}
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
