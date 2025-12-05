import { apiClient } from '@/infrastructure/api/apiClient';

interface Role {
  id: string;
  name: string;
  description?: string;
}

class RoleService {
  private rolesCache: Role[] | null = null;
  private roleMapCache: Map<string, string> = new Map(); // name -> id
  private roleMapIdCache: Map<string, string> = new Map(); // id -> name

  async loadRoles(): Promise<void> {
    if (this.rolesCache) {
      return;
    }

    // Verificar que estamos en el navegador
    if (typeof window === 'undefined') {
      this.rolesCache = [];
      return;
    }

    // Verificar si hay autenticación (token en localStorage O usuario en localStorage para OAuth)
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (!token && !savedUser) {
      console.log('⚠️ No authentication found, skipping role loading');
      this.rolesCache = [];
      return;
    }

    try {
      console.log('🔄 Loading roles from API...');
      const response = await apiClient.get<any>('/roles', true);
      
      // El backend puede devolver array directo o { data: [...] }
      let roles: Role[];
      
      if (Array.isArray(response)) {
        roles = response;
      } else if (response && Array.isArray(response.data)) {
        roles = response.data;
      } else if (response && Array.isArray(response.roles)) {
        roles = response.roles;
      } else {
        console.error('❌ Unexpected response structure from /roles:', response);
        roles = [];
      }
      
      this.rolesCache = roles;
      
      // Crear mapeos
      roles.forEach(role => {
        this.roleMapCache.set(role.name, role.id);
        this.roleMapIdCache.set(role.id, role.name);
      });
      
      console.log(`✅ Loaded ${roles.length} roles:`, roles.map(r => r.name).join(', '));
    } catch (error: any) {
      console.error('❌ Error loading roles:', error);
      
      // Si es 401, el token expiró o es inválido
      if (error?.statusCode === 401) {
        console.error('🔒 Unauthorized: Token may be expired or invalid');
      }
      
      // Inicializar cache vacío para evitar llamadas repetidas
      this.rolesCache = [];
    }
  }

  getRoleIdByName(name: string): string | null {
    return this.roleMapCache.get(name) || null;
  }

  getRoleNameById(id: string): string | null {
    return this.roleMapIdCache.get(id) || null;
  }

  getAllRoles(): Role[] {
    return this.rolesCache || [];
  }

  clearCache(): void {
    this.rolesCache = null;
    this.roleMapCache.clear();
    this.roleMapIdCache.clear();
  }

  isLoaded(): boolean {
    return this.rolesCache !== null;
  }
}

export const roleService = new RoleService();
