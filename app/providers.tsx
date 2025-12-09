"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { RepositoryProvider } from "@/presentation/providers/RepositoryProvider";
import { AuthProvider as NewAuthProvider } from "@/hooks/use-auth";
import { SessionExpiredHandler } from "@/components/SessionExpiredHandler";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos - datos considerados frescos
            gcTime: 10 * 60 * 1000, // 10 minutos - tiempo en caché antes de limpiar
            refetchOnWindowFocus: false, // Evitar refetch al cambiar de pestaña
            retry: 1, // Solo reintentar una vez en caso de error
          },
          mutations: {
            retry: 0, // No reintentar mutations automáticamente
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NewAuthProvider>
        <TooltipProvider>
          <RepositoryProvider>
            <SessionExpiredHandler />
            {children}
            <Toaster />
            <Sonner />
          </RepositoryProvider>
        </TooltipProvider>
      </NewAuthProvider>
    </QueryClientProvider>
  );
}
