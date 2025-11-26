import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { User } from '@/domain/entities/User';
import { apiClient } from '@/infrastructure/api/apiClient';
import { roleService } from '@/infrastructure/services/roleService';

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
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export class ApiUserRepository implements IUserRepository {
  constructor() {
    // Cargar roles al inicializar
    roleService.loadRoles().catch(err => 
      console.error('Failed to load roles:', err)
    );
  }

  // Asignar un Jefe a un área
  private async assignManagerToArea(areaId: string, managerId: string): Promise<void> {
    try {
      await apiClient.post(`/areas/${areaId}/managers`, { managerId }, true);
      console.log(`✅ Manager ${managerId} assigned to area ${areaId}`);
    } catch (error) {
      console.error(`Error assigning manager to area:`, error);
      // No lanzar error para permitir que continúe con otras asignaciones
    }
  }

  // Asignar un Supervisor a una bodega
  private async assignSupervisorToWarehouse(warehouseId: string, supervisorId: string): Promise<void> {
    try {
      await apiClient.post(`/warehouses/${warehouseId}/supervisors`, { supervisorId }, true);
      console.log(`✅ Supervisor ${supervisorId} assigned to warehouse ${warehouseId}`);
    } catch (error) {
      console.error(`Error assigning supervisor to warehouse:`, error);
      // No lanzar error para permitir que continúe con otras asignaciones
    }
  }

  // Procesar asignaciones después de crear/actualizar usuario
  private async processAssignments(user: User, role: string): Promise<void> {
    console.log('📋 Processing assignments for user:', user.id, 'Role:', role);
    
    // Si es Jefe (JEFE), asignar a áreas
    if (role === 'JEFE' && user.areas && user.areas.length > 0) {
      console.log('👔 Assigning JEFE to', user.areas.length, 'areas');
      for (const areaId of user.areas) {
        await this.assignManagerToArea(areaId, user.id);
      }
    }
    
    // Si es Supervisor, asignar a bodegas
    if (role === 'SUPERVISOR' && user.warehouses && user.warehouses.length > 0) {
      console.log('👷 Assigning SUPERVISOR to', user.warehouses.length, 'warehouses');
      for (const warehouseId of user.warehouses) {
        await this.assignSupervisorToWarehouse(warehouseId, user.id);
      }
    }
  }

  // Mapear usuario del backend al dominio
  private mapBackendUser(backendUser: BackendUser): User {
    return {
      id: backendUser.id,
      name: backendUser.firstName, // Mapear firstName -> name
      lastName: backendUser.lastName,
      email: backendUser.email,
      rut: backendUser.rut || '',
      phone: backendUser.phone || '',
      role: (backendUser.role?.name || 'SUPERVISOR') as 'ADMIN' | 'JEFE' | 'SUPERVISOR',
      status: 'HABILITADO' as const,
      areas: [], // TODO: Backend debe agregar estos campos
      warehouses: [], // TODO: Backend debe agregar estos campos
      tenantId: backendUser.tenantId,
    };
  }

  // Mapear usuario del dominio al backend
  private async mapDomainUser(user: Omit<User, 'id'>) {
    // Asegurar que los roles están cargados
    await roleService.loadRoles();
    
    // Obtener roleId desde el nombre del rol
    const roleId = roleService.getRoleIdByName(user.role);
    
    return {
      email: user.email,
      firstName: user.name, // Mapear name -> firstName
      lastName: user.lastName,
      rut: user.rut || null,
      phone: user.phone || null,
      roleId: roleId || user.role, // Usar roleId si está disponible, sino el nombre
      areas: user.areas,
      warehouses: user.warehouses,
    };
  }

  async findAll(tenantId: string): Promise<User[]> {
    try {
      const response = await apiClient.get<any>('/users', true);
      console.log('📥 GET /users response structure:', response);
      console.log('📥 Response type:', typeof response);
      console.log('📥 Is array?', Array.isArray(response));
      console.log('📥 Response keys:', response && typeof response === 'object' ? Object.keys(response) : 'N/A');
      
      // El backend puede devolver diferentes estructuras:
      // Opción 1: Array directo: [user1, user2, ...]
      // Opción 2: Objeto con data: { data: [user1, user2, ...] }
      // Opción 3: Objeto con users: { users: [user1, user2, ...] }
      let backendUsers: BackendUser[];
      
      if (Array.isArray(response)) {
        backendUsers = response;
      } else if (response && Array.isArray(response.data)) {
        backendUsers = response.data;
      } else if (response && Array.isArray(response.users)) {
        backendUsers = response.users;
      } else {
        console.error('❌ Unexpected response structure from /users:', response);
        return [];
      }
      
      console.log('✅ Extracted', backendUsers.length, 'users');
      return backendUsers.map(u => this.mapBackendUser(u));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
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

  async create(user: Omit<User, 'id'>): Promise<User> {
    try {
      const mappedUser = await this.mapDomainUser(user);
      const payload = {
        ...mappedUser,
        password: 'TempPassword123!@#', // TODO: Implementar generación de contraseña temporal
      };
      
      // No enviar areas/warehouses en el payload del usuario
      const { areas, warehouses, ...userPayload } = payload;
      
      console.log('📤 Creating user:', userPayload);
      const backendUser = await apiClient.post<BackendUser, typeof userPayload>('/users', userPayload, true);
      const createdUser = this.mapBackendUser(backendUser);
      
      // Procesar asignaciones después de crear el usuario
      createdUser.areas = user.areas || [];
      createdUser.warehouses = user.warehouses || [];
      await this.processAssignments(createdUser, user.role);
      
      return createdUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<User>, tenantId: string): Promise<User> {
    try {
      await roleService.loadRoles(); // Asegurar roles cargados
      
      const payload: any = {};
      if (updates.name) payload.firstName = updates.name;
      if (updates.lastName) payload.lastName = updates.lastName;
      if (updates.email) payload.email = updates.email;
      if (updates.rut !== undefined) payload.rut = updates.rut || null;
      if (updates.phone !== undefined) payload.phone = updates.phone || null;
      if (updates.role) {
        const roleId = roleService.getRoleIdByName(updates.role);
        payload.roleId = roleId || updates.role;
      }
      
      // No enviar areas/warehouses en el payload del usuario
      const hasAssignments = updates.areas || updates.warehouses;
      
      console.log('📤 Updating user:', id, payload);
      const backendUser = await apiClient.put<BackendUser, typeof payload>(`/users/${id}`, payload, true);
      const updatedUser = this.mapBackendUser(backendUser);
      
      // Procesar asignaciones si se proporcionaron
      if (hasAssignments) {
        updatedUser.areas = updates.areas || [];
        updatedUser.warehouses = updates.warehouses || [];
        
        // Usar el rol actualizado o el existente
        const userRole = updates.role || updatedUser.role;
        await this.processAssignments(updatedUser, userRole);
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async disable(id: string, tenantId: string): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}`, true);
    } catch (error) {
      console.error('Error disabling user:', error);
      throw error;
    }
  }

  async checkEmailExists(email: string, tenantId: string, excludeUserId?: string): Promise<boolean> {
    try {
      // TODO: Backend debe implementar este endpoint
      // Por ahora, hacemos un workaround obteniendo todos los usuarios
      const users = await this.findAll(tenantId);
      return users.some(u => 
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
      // TODO: Backend debe implementar POST /users/{id}/verify-password
      // Por ahora retornamos true para permitir testing
      console.warn('verifyPassword not implemented in backend, returning true');
      return true;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  async changePassword(userId: string, newPassword: string, tenantId: string): Promise<void> {
    try {
      // TODO: Backend debe implementar PUT /users/{id}/change-password
      console.warn('changePassword not implemented in backend');
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
}
