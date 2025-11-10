"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/domain/entities/User';
import { TENANT_ID } from '@/shared/constants';
import { Permission, hasPermission, getRolePermissions } from '@/shared/permissions';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  permissions: Permission[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuario mock para desarrollo
const MOCK_USER: User = {
  id: 'user-admin-001',
  name: 'Juan',
  lastName: 'Pérez',
  email: 'juan.perez@kreatech.cl',
  rut: '12345678-9',
  phone: '+56912345678',
  role: 'ADMIN',
  status: 'HABILITADO',
  areas: ['area-001', 'area-002'],
  warehouses: ['warehouse-001'],
  tenantId: TENANT_ID,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simular carga de usuario desde localStorage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = localStorage.getItem('kreatech_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (_email: string, _password: string) => {
    // Simulación de login - en producción llamaría a un API
    setIsLoading(true);
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock: cualquier email/password funciona
    const loggedUser = MOCK_USER;
    
    setUser(loggedUser);
    localStorage.setItem('kreatech_user', JSON.stringify(loggedUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kreatech_user');
  };

  const checkPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  const permissions = user ? getRolePermissions(user.role) : [];

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission: checkPermission,
    permissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
