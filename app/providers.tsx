"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { RepositoryProvider } from "@/presentation/providers/RepositoryProvider";
import { AuthProvider as NewAuthProvider } from "@/hooks/use-auth";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <NewAuthProvider>
        <TooltipProvider>
          <RepositoryProvider>
            {children}
            <Toaster />
            <Sonner />
          </RepositoryProvider>
        </TooltipProvider>
      </NewAuthProvider>
    </QueryClientProvider>
  );
}
