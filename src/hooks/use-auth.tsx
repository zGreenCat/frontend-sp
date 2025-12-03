"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/infrastructure/services/authService";
import { User, LoginRequest, RegisterRequest, ApiError } from "@/shared/types/auth.types";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  getUserRole: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Cargar usuario al iniciar
  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      const savedUser = authService.getUser();

      if (token && savedUser) {
        try {
          // Verificar token obteniendo perfil actualizado
          const currentUser = await authService.getProfile();
          setUser(currentUser);
        } catch {
          // Token inválido o expirado
          authService.logout();
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await authService.login(data);
      setUser(response.user);
      console.log('✅ User set in context:', response.user.areas); // DEBUG
      toast({
        title: "¡Bienvenido!",
        description: `Hola ${response.user.firstName || response.user.email}`,
        variant: "default",
      });

      router.push("/dashboard");
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        title: "Error al iniciar sesión",
        description: apiError.message || "Verifica tus credenciales",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      setIsLoading(true);
      const response = await authService.register(data);
      setUser(response.user);
      
      toast({
        title: "¡Cuenta creada!",
        description: "Tu cuenta ha sido creada exitosamente",
        variant: "default",
      });

      router.push("/dashboard");
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        title: "Error al registrarse",
        description: apiError.message || "No se pudo crear la cuenta",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });

    router.push("/login");
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getProfile();
      setUser(currentUser);
    } catch (error) {
      console.error("Error refreshing user:", error);
      logout();
    }
  };

  const hasPermission = (_permission: string): boolean => {
    // TODO: Implementar lógica de permisos basada en el rol del usuario
    // Por ahora retorna true para todos los permisos
    return true;
  };

  const getUserRole = (): string | null => {
    if (!user) return null;
    // Normalizar el rol desde diferentes estructuras
    if (typeof user.role === 'string') return user.role;
    if (user.role && typeof user.role === 'object') return user.role.name;
    return user.roleId || null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        hasPermission,
        getUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
