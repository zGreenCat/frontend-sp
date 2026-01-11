"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/infrastructure/services/authService";
import { User, LoginRequest, RegisterRequest, ApiError } from "@/shared/types/auth.types";
import { useToast } from "@/hooks/use-toast";
import { hasTokens } from "@/lib/auth-storage";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  loginWithGoogle: () => void;
  loginWithCode: (code: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
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
      console.log('═══════════════════════════════════════════════');
      console.log('🔐 useAuth - INICIALIZANDO AUTENTICACIÓN');
      console.log('═══════════════════════════════════════════════');

      try {
        // 1) Ver si hay tokens y usuario en localStorage
        const cachedUser = authService.getUser();
        const hasAuth = hasTokens();

        if (cachedUser && hasAuth) {
          // Hidratar estado con usuario cacheado para evitar parpadeos
          setUser(cachedUser);
        }

        // 2) Si estoy en página pública, limpiar cualquier sesión anterior
        const isPublicPage =
          typeof window !== 'undefined' &&
          (window.location.pathname === '/login' ||
            window.location.pathname === '/register' ||
            window.location.pathname === '/auth/error');

        if (isPublicPage) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        // 3) Si no hay tokens, no hay sesión válida
        if (!hasAuth) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        // 4) Verificar que la sesión sea válida con /users/me
        try {
          const currentUser = await authService.getProfile();
          setUser(currentUser);
        } catch (error) {
          // Token inválido o expirado
          console.error("Token inválido, limpiando sesión:", error);
          setUser(null);
          authService.logout();
        }
      } catch (error) {
        console.error("Error inicializando auth:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);




  const login = async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await authService.login(data);
      setUser(response.user);
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

  const loginWithCode = async (code: string) => {
    try {
      setIsLoading(true);
      const user = await authService.exchangeCode(code);
      setUser(user);
      toast({
        title: "¡Bienvenido!",
        description: `Hola ${user.firstName || user.email}`,
        variant: "default",
      });
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        title: "Error al autenticar",
        description: apiError.message || "No se pudo completar la autenticación",
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

  const logout = async () => {
    await authService.logout();
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

  const loginWithGoogle = () => {
    authService.loginWithGoogle();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        loginWithCode,
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
