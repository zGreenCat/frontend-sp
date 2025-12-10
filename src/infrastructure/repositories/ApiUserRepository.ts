import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { User, ValidateUserUniqueInput, ValidateUserUniqueResult } from '@/domain/entities/User';
import { apiClient } from '@/infrastructure/api/apiClient';
import { roleService } from '@/infrastructure/services/roleService';
import { mapFrontendRoleToBackend, mapBackendRoleToFrontend, USER_ROLES } from '@/shared/constants';

// Tipo para el usuario del backend
interface BackendUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  rut?: string;
  phone?: string;
  roleId: string;
  role?: {
    id: string;
    name: string;
    description?: string;
  };
  isEnabled?: boolean; // Estado del usuario
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  // Asignaciones del backend (solo lectura)
  areaAssignments?: Array<{
    id: string;
    areaId: string;
    area?: {
      id: string;
      name: string;
      nodeType: string;
      level: number;
      isActive?: boolean;
    };
    assignedAt: string;
    isActive: boolean;
    assignedBy?: string;
    revokedAt?: string | null;
  }>;
  warehouseAssignments?: Array<{
    id: string;
    warehouseId: string;
    warehouse?: {
      id: string;
      name: string;
      capacityKg: number;
    };
    assignedAt: string;
    isActive: boolean;
  }>;
}

export class ApiUserRepository implements IUserRepository {
  // Mapear usuario del backend al dominio
  private mapBackendUser(backendUser: BackendUser): User {
    // Mapear rol del backend al frontend (AREA_MANAGER -> JEFE, SUPERVISOR -> SUPERVISOR)
    const backendRoleName = backendUser.role?.name || 'SUPERVISOR';
    const frontendRole = mapBackendRoleToFrontend(backendRoleName);
    
    // IDs de áreas
    const areas = backendUser.areaAssignments
      ?.filter(a => a.isActive)
      .map(a => a.areaId) || [];
    
    // IDs de bodegas
    const warehouses = backendUser.warehouseAssignments
      ?.filter(w => w.isActive)
      .map(w => w.warehouseId) || [];
    
    // Detalles de áreas
    const areaDetails = backendUser.areaAssignments
      ?.filter(a => a.isActive && a.area)
      .map(a => ({
        id: a.areaId,
        name: a.area!.name,
      })) || [];
    
    // Detalles de bodegas
    const warehouseDetails = backendUser.warehouseAssignments
      ?.filter(w => w.isActive && w.warehouse)
      .map(w => ({
        id: w.warehouseId,
        name: w.warehouse!.name,
      })) || [];
    
    // Preservar areaAssignments completo
    const areaAssignments = backendUser.areaAssignments?.map(a => ({
      id: a.id,
      userId: backendUser.id,
      areaId: a.areaId,
      assignedBy: a.assignedBy || '',
      assignedAt: a.assignedAt,
      revokedAt: a.revokedAt || null,
      isActive: a.isActive,
      area: a.area ? {
        id: a.area.id,
        name: a.area.name,
        nodeType: a.area.nodeType,
        level: a.area.level,
        isActive: a.area.isActive ?? true,
      } : {
        id: a.areaId,
        name: 'Sin nombre',
        nodeType: 'ROOT',
        level: 0,
        isActive: true,
      },
    })) || [];
    
    // Log para debugging (solo si hay asignaciones)
    if (areas.length > 0 || warehouses.length > 0) {
      console.log(`✅ User ${backendUser.firstName} ${backendUser.lastName}:`, {
        areas: areas.length,
        warehouses: warehouses.length,
        areaDetails: areaDetails.map(a => a.name),
        warehouseDetails: warehouseDetails.map(w => w.name),
      });
    }
    
    return {
      id: backendUser.id,
      name: backendUser.firstName,
      lastName: backendUser.lastName,
      email: backendUser.email,
      rut: backendUser.rut || '',
      phone: backendUser.phone || '',
      role: frontendRole as 'ADMIN' | 'JEFE' | 'SUPERVISOR',
      status: backendUser.isEnabled !== false ? 'HABILITADO' : 'DESHABILITADO',
      areas,
      warehouses,
      areaDetails,
      warehouseDetails,
      areaAssignments,
      tenantId: backendUser.tenantId,
    };
  }

  // Mapear usuario del dominio al backend (solo datos propios del usuario)
  private async mapDomainUser(user: Omit<User, 'id'>) {
    const backendRole = mapFrontendRoleToBackend(user.role);
    const cleanRut = user.rut ? user.rut.replace(/[.-]/g, '') : null;
    
    return {
      email: user.email,
      firstName: user.name,
      lastName: user.lastName,
      rut: cleanRut,
      phone: user.phone || null,
      role: backendRole,
      // OJO: ya no mandamos areas/warehouses desde acá
    };
  }

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<import('@/domain/repositories/IUserRepository').PaginatedResponse<User>> {
    try {
      const url = `/users?page=${page}&limit=${limit}`;
      console.log('🌐 API Call:', url);
      const response = await apiClient.get<any>(url, true);
      console.log('📦 API Response:', response);
      
      if (response && Array.isArray(response.data)) {
        return {
          data: response.data.map((u: BackendUser) => this.mapBackendUser(u)),
          page: response.page || page,
          limit: response.limit || limit,
          totalPages: response.totalPages || 1,
          total: response.total || response.data.length,
          hasNext: response.hasNext || false,
          hasPrev: response.hasPrev || false,
        };
      } else {
        console.error('❌ Unexpected response structure from /users:', response);
        return {
          data: [],
          page: 1,
          limit: 10,
          totalPages: 0,
          total: 0,
          hasNext: false,
          hasPrev: false,
        };
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async findByArea(areaId: string): Promise<User[]> {
    try {
      console.log(`🔍 Fetching users for area: ${areaId}`);
      const response = await apiClient.get<any>(`/users/area/${areaId}`, true);
      console.log('📦 Users by area response:', response);
      
      let backendUsers: BackendUser[];
      
      if (Array.isArray(response)) {
        backendUsers = response;
      } else if (response && Array.isArray(response.data)) {
        backendUsers = response.data;
      } else if (response && Array.isArray(response.users)) {
        backendUsers = response.users;
      } else {
        console.error('❌ Unexpected response structure from /users/area:', response);
        return [];
      }
      
      console.log(`✅ Found ${backendUsers.length} users for area ${areaId}`);
      return backendUsers.map(u => this.mapBackendUser(u));
    } catch (error) {
      console.error('Error fetching users by area:', error);
      return [];
    }
  }

  async findById(id: string, tenantId: string): Promise<User | null> {
    try {
      const backendUser = await apiClient.get<BackendUser>(`/users/${id}`, true);
      return this.mapBackendUser(backendUser);
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async findByRole(
    roleName: string,
    tenantId: string
  ): Promise<{
    data: User[];
    page: number;
    limit: number | null;
    totalPages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    try {
      console.log(`🔍 Fetching users with role: ${roleName}`);
      
      await roleService.loadRoles();
      const roleId = roleService.getRoleIdByName(roleName);
      
      if (!roleId) {
        console.error(`❌ Role ID not found for role name: ${roleName}`);
        return {
          data: [],
          page: 1,
          limit: null,
          totalPages: 0,
          total: 0,
          hasNext: false,
          hasPrev: false,
        };
      }
      
      console.log(`✅ Using roleId: ${roleId} for role: ${roleName}`);
      
      const response = await apiClient.get<any>(`/users?roleId=${roleId}`, true);
      console.log('📦 Users by role response:', response);
      
      let backendUsers: BackendUser[];
      
      if (response && Array.isArray(response.data)) {
        backendUsers = response.data;
      } else if (Array.isArray(response)) {
        backendUsers = response;
      } else {
        console.error('❌ Unexpected response structure from /users?roleId:', response);
        return {
          data: [],
          page: 1,
          limit: null,
          totalPages: 0,
          total: 0,
          hasNext: false,
          hasPrev: false,
        };
      }
      
      console.log(`✅ Found ${backendUsers.length} users with role ${roleName} (roleId: ${roleId})`);
      
      return {
        data: backendUsers.map(u => this.mapBackendUser(u)),
        page: response.page || 1,
        limit: response.limit || null,
        totalPages: response.totalPages || 1,
        total: response.total || backendUsers.length,
        hasNext: response.hasNext || false,
        hasPrev: response.hasPrev || false,
      };
    } catch (error) {
      console.error('Error fetching users by role:', error);
      return {
        data: [],
        page: 1,
        limit: null,
        totalPages: 0,
        total: 0,
        hasNext: false,
        hasPrev: false,
      };
    }
  }

  async create(user: Omit<User, 'id'>): Promise<User> {
    try {
      console.log('📝 Creating user with role:', user.role);
      const backendRole = mapFrontendRoleToBackend(user.role);
      console.log('🔄 Backend role:', backendRole);
      
      console.log('🔄 Loading roles...');
      await roleService.loadRoles();
      
      const roleId = roleService.getRoleIdByName(backendRole);
      console.log('🔑 Role ID found:', roleId);
      
      if (!roleId) {
        const allRoles = roleService.getAllRoles();
        console.error('❌ Role ID not found. Available roles:', allRoles);
        throw new Error(
          `Role ID not found for role: ${backendRole}. Available roles: ${allRoles
            .map(r => r.name)
            .join(', ')}`
        );
      }
      
      const cleanRut = user.rut ? user.rut.replace(/[.-]/g, '') : null;
      
      // Password temporal: RUT sin puntos, sin guion y sin dígito verificador
      const tempPassword = cleanRut ? cleanRut.slice(0, -1) : 'TempPassword123!@#';
      
      const payload = {
        email: user.email,
        password: tempPassword,
        firstName: user.name,
        lastName: user.lastName,
        rut: cleanRut,
        phone: user.phone || null,
        roleId,
      };
      
      const response = await apiClient.post<any>('/users', payload, true);
      const backendUser = response.user || response;
      const createdUser = this.mapBackendUser(backendUser);

      // 👇 Importante: las asignaciones (areas/warehouses)
      // ahora las maneja un UseCase con AssignmentRepository,
      // no este repositorio.

      return createdUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<User>, tenantId: string): Promise<User> {
    try {
      const payload: any = {};
      if (updates.name) payload.firstName = updates.name;
      if (updates.lastName) payload.lastName = updates.lastName;
      if (updates.email) payload.email = updates.email;
      
      if (updates.rut !== undefined) {
        payload.rut = updates.rut ? updates.rut.replace(/[.-]/g, '') : null;
      }
      
      if (updates.phone !== undefined) {
        payload.phone = updates.phone || null;
      }
      
      if (updates.status !== undefined) {
        payload.isEnabled = updates.status === 'HABILITADO';
      }

      // ⚠️ IMPORTANTE:
      // - Este método SOLO actualiza datos propios del usuario.
      // - NO maneja ni role ni areas/warehouses.
      //   Las asignaciones se manejan en un UseCase separado.

      const backendUser = await apiClient.put<BackendUser, typeof payload>(
        `/users/${id}`,
        payload,
        true
      );
      const updatedUser = this.mapBackendUser(backendUser);
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async disable(id: string, tenantId: string): Promise<void> {
    try {
      await apiClient.put(`/users/${id}`, { isEnabled: false }, true);
    } catch (error) {
      console.error('Error disabling user:', error);
      throw error;
    }
  }

  async checkEmailExists(
    email: string,
    tenantId: string,
    excludeUserId?: string
  ): Promise<boolean> {
    try {
      const response = await this.findAll(tenantId);
      return response.data.some(
        (u: User) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          u.id !== excludeUserId
      );
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  }

  async verifyPassword(userId: string, password: string, tenantId: string): Promise<boolean> {
    try {
      console.warn('verifyPassword not implemented in backend, returning true');
      return true;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  async changePassword(userId: string, newPassword: string, tenantId: string): Promise<void> {
    try {
      console.warn('changePassword not implemented in backend');
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  async validateUnique(input: ValidateUserUniqueInput): Promise<ValidateUserUniqueResult> {
  const response = await apiClient.post<ValidateUserUniqueResult>(
    "/users/validate-unique",
    input,
    true
  );

  return response;
}
}


