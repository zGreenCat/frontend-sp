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
    if (this.rolesCache) return; // Ya cargados

    try {
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
      
      console.log('✅ Loaded', roles.length, 'roles:', roles.map(r => r.name).join(', '));
    } catch (error) {
      console.error('Error loading roles:', error);
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
}

export const roleService = new RoleService();
