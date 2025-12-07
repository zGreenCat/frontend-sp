"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function SessionExpiredHandler() {
  const { toast } = useToast();

  useEffect(() => {
    const handleSessionExpired = (event: CustomEvent) => {
      toast({
        title: "⏰ Sesión Expirada",
        description: event.detail.message || "Su sesión ha expirado. Por favor, inicie sesión nuevamente.",
        variant: "destructive",
        duration: 5000,
      });
    };

    window.addEventListener("session-expired", handleSessionExpired as EventListener);

    return () => {
      window.removeEventListener("session-expired", handleSessionExpired as EventListener);
    };
  }, [toast]);

  return null;
}
