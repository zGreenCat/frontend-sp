import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { User } from '@/domain/entities/User';
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
  // Asignaciones del backend
  areaAssignments?: Array<{
    id: string;
    areaId: string;
    area?: {
      id: string;
      name: string;
      nodeType: string;
      level: number;
    };
    assignedAt: string;
    isActive: boolean;
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
  // No cargar roles en constructor para evitar errores de SSR
  // Los roles se cargarán solo cuando sean necesarios

  // Asignar un Jefe a un área
  // Según backend: Solo ADMIN puede hacer esta asignación
  private async assignManagerToArea(areaId: string, managerId: string): Promise<void> {
    try {
      await apiClient.post(`/areas/${areaId}/managers`, { 
        managerId
      }, true);
    } catch (error) {
      console.error(`Error assigning manager to area:`, error);
      throw error;
    }
  }

  // Remover un Jefe de un área
  private async removeManagerFromArea(areaId: string, managerId: string): Promise<void> {
    try {
      // 1. Obtener todas las asignaciones
      const assignments = await apiClient.get<any[]>('/assignments', true);
      
      // 2. Buscar la asignación específica de tipo AREA_MANAGER
      const assignment = assignments.find(a => 
        a.type === 'AREA_MANAGER' && 
        a.userId === managerId && 
        a.areaId === areaId &&
        a.isActive === true
      );
      
      if (!assignment) {
        console.warn(`No active assignment found for manager ${managerId} in area ${areaId}`);
        return;
      }
      
      // 3. Eliminar usando el assignmentId
      await apiClient.delete(`/assignments/${assignment.id}`, true);
    } catch (error) {
      console.error(`Error removing manager from area:`, error);
      throw error;
    }
  }

  // Asignar un Supervisor a una bodega
  // Según backend: AREA_MANAGER o ADMIN pueden hacer esta asignación
  private async assignSupervisorToWarehouse(warehouseId: string, supervisorId: string): Promise<void> {
    try {
      await apiClient.post(`/warehouses/${warehouseId}/supervisors`, { 
        supervisorId
      }, true);
    } catch (error) {
      console.error(`Error assigning supervisor to warehouse:`, error);
      throw error;
    }
  }

  // Remover un Supervisor de una bodega
  private async removeSupervisorFromWarehouse(warehouseId: string, supervisorId: string): Promise<void> {
    try {
      // 1. Obtener todas las asignaciones
      const assignments = await apiClient.get<any[]>('/assignments', true);
      
      // 2. Buscar la asignación específica de tipo WAREHOUSE_SUPERVISOR
      const warehouseAssignment = assignments.find(a => 
        a.type === 'WAREHOUSE_SUPERVISOR' && 
        a.userId === supervisorId && 
        a.warehouseId === warehouseId &&
        a.isActive === true
      );
      
      if (!warehouseAssignment) {
        console.warn(`No active assignment found for supervisor ${supervisorId} in warehouse ${warehouseId}`);
        return;
      }
      
      // Obtener el área de la bodega que se va a remover
      const areaIdOfWarehouse = warehouseAssignment.warehouseName ? 
        await this.getAreaIdFromWarehouse(warehouseId) : null;
      
      // 3. Eliminar la asignación de bodega usando el assignmentId
      await apiClient.delete(`/assignments/${warehouseAssignment.id}`, true);
      console.log(`✅ Removed warehouse assignment ${warehouseAssignment.id}`);
      
      // 4. Verificar si el supervisor tiene más bodegas asignadas en la misma área
      if (areaIdOfWarehouse) {
        // Obtener asignaciones actualizadas después de eliminar
        const updatedAssignments = await apiClient.get<any[]>('/assignments', true);
        
        // Buscar otras bodegas del supervisor en la misma área
        const otherWarehousesInArea = updatedAssignments.filter(a => 
          a.type === 'WAREHOUSE_SUPERVISOR' &&
          a.userId === supervisorId &&
          a.isActive === true &&
          a.warehouseId !== warehouseId
        );
        
        // Verificar si alguna de esas bodegas pertenece a la misma área
        const hasOtherWarehousesInSameArea = await this.hasWarehousesInArea(
          otherWarehousesInArea.map((a: any) => a.warehouseId),
          areaIdOfWarehouse
        );
        
        // Si no tiene más bodegas en esa área, remover la asignación de área
        if (!hasOtherWarehousesInSameArea) {
          const areaManagerAssignment = updatedAssignments.find(a =>
            a.type === 'AREA_MANAGER' &&
            a.userId === supervisorId &&
            a.areaId === areaIdOfWarehouse &&
            a.isActive === true
          );
          
          if (areaManagerAssignment) {
            await apiClient.delete(`/assignments/${areaManagerAssignment.id}`, true);
            console.log(`✅ Removed area assignment ${areaManagerAssignment.id} (no more warehouses in area)`);
          }
        }
      }
    } catch (error) {
      console.error(`Error removing supervisor from warehouse:`, error);
      throw error;
    }
  }
  
  // Método auxiliar para obtener el areaId de una bodega
  private async getAreaIdFromWarehouse(warehouseId: string): Promise<string | null> {
    try {
      const assignments = await apiClient.get<any[]>('/assignments', true);
      const warehouseAreaAssignment = assignments.find(a =>
        a.type === 'AREA_WAREHOUSE' &&
        a.warehouseId === warehouseId &&
        a.isActive === true
      );
      return warehouseAreaAssignment?.areaId || null;
    } catch (error) {
      console.error('Error getting area from warehouse:', error);
      return null;
    }
  }
  
  // Método auxiliar para verificar si hay bodegas en un área específica
  private async hasWarehousesInArea(warehouseIds: string[], areaId: string): Promise<boolean> {
    try {
      if (warehouseIds.length === 0) return false;
      
      const assignments = await apiClient.get<any[]>('/assignments', true);
      
      // Verificar si alguna de las bodegas pertenece al área especificada
      for (const warehouseId of warehouseIds) {
        const warehouseAreaAssignment = assignments.find(a =>
          a.type === 'AREA_WAREHOUSE' &&
          a.warehouseId === warehouseId &&
          a.areaId === areaId &&
          a.isActive === true
        );
        
        if (warehouseAreaAssignment) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking warehouses in area:', error);
      return false;
    }
  }

  // Procesar asignaciones después de crear/actualizar usuario
  // El backend obtiene assignedBy de la base de datos
  // Maneja tanto agregar como remover asignaciones
  private async processAssignments(
    user: User, 
    role: string, 
    previousAreas: string[] = [], 
    previousWarehouses: string[] = []
  ): Promise<void> {
    // Normalizar el rol para comparación
    const normalizedRole = typeof role === 'string' ? role : '';
    const isJefe = normalizedRole === 'JEFE' || normalizedRole === 'JEFE_AREA' || normalizedRole === USER_ROLES.JEFE;
    const isSupervisor = normalizedRole === 'SUPERVISOR' || normalizedRole === USER_ROLES.SUPERVISOR;
    
    // Procesar asignaciones de JEFE (Áreas)
    if (isJefe) {
      const currentAreas = user.areas || [];
      
      // Áreas a agregar (están en current pero no en previous)
      const areasToAdd = currentAreas.filter(id => !previousAreas.includes(id));
      for (const areaId of areasToAdd) {
        await this.assignManagerToArea(areaId, user.id);
      }
      
      // Áreas a remover (están en previous pero no en current)
      const areasToRemove = previousAreas.filter(id => !currentAreas.includes(id));
      for (const areaId of areasToRemove) {
        await this.removeManagerFromArea(areaId, user.id);
      }
    }
    
    // Procesar asignaciones de SUPERVISOR (Bodegas)
    if (isSupervisor) {
      const currentWarehouses = user.warehouses || [];
      
      // Bodegas a agregar (están en current pero no en previous)
      const warehousesToAdd = currentWarehouses.filter(id => !previousWarehouses.includes(id));
      for (const warehouseId of warehousesToAdd) {
        await this.assignSupervisorToWarehouse(warehouseId, user.id);
      }
      
      // Bodegas a remover (están en previous pero no en current)
      const warehousesToRemove = previousWarehouses.filter(id => !currentWarehouses.includes(id));
      for (const warehouseId of warehousesToRemove) {
        await this.removeSupervisorFromWarehouse(warehouseId, user.id);
      }
    }
  }

  // Mapear usuario del backend al dominio
  private mapBackendUser(backendUser: BackendUser): User {
    // Mapear rol del backend al frontend (AREA_MANAGER -> JEFE, SUPERVISOR -> SUPERVISOR)
    const backendRoleName = backendUser.role?.name || 'SUPERVISOR';
    const frontendRole = mapBackendRoleToFrontend(backendRoleName);
    
    // Extraer IDs de áreas desde areaAssignments (solo las activas)
    const areas = backendUser.areaAssignments
      ?.filter(a => a.isActive)
      .map(a => a.areaId) || [];
    
    // Extraer IDs de bodegas desde warehouseAssignments (solo las activas)
    const warehouses = backendUser.warehouseAssignments
      ?.filter(w => w.isActive)
      .map(w => w.warehouseId) || [];
    
    // Extraer detalles de áreas (ID y nombre)
    const areaDetails = backendUser.areaAssignments
      ?.filter(a => a.isActive && a.area)
      .map(a => ({
        id: a.areaId,
        name: a.area!.name
      })) || [];
    
    // Extraer detalles de bodegas (ID y nombre)
    const warehouseDetails = backendUser.warehouseAssignments
      ?.filter(w => w.isActive && w.warehouse)
      .map(w => ({
        id: w.warehouseId,
        name: w.warehouse!.name
      })) || [];
    
    // Preservar areaAssignments completo con toda la información
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
      }
    })) || [];
    
    // Log para debugging (solo si hay asignaciones)
    if (areas.length > 0 || warehouses.length > 0) {
      console.log(`✅ User ${backendUser.firstName} ${backendUser.lastName}:`, {
        areas: areas.length,
        warehouses: warehouses.length,
        areaDetails: areaDetails.map(a => a.name),
        warehouseDetails: warehouseDetails.map(w => w.name)
      });
    }
    
    return {
      id: backendUser.id,
      name: backendUser.firstName, // Mapear firstName -> name
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
      areaAssignments, // Agregar areaAssignments completo
      tenantId: backendUser.tenantId,
    };
  }

  // Mapear usuario del dominio al backend
  private async mapDomainUser(user: Omit<User, 'id'>) {
    // Mapear rol de frontend a backend (JEFE -> AREA_MANAGER, SUPERVISOR -> SUPERVISOR)
    const backendRole = mapFrontendRoleToBackend(user.role);
    
    // Limpiar RUT: quitar puntos y guiones
    const cleanRut = user.rut ? user.rut.replace(/[.-]/g, '') : null;
    
    return {
      email: user.email,
      firstName: user.name, // Mapear name -> firstName
      lastName: user.lastName,
      rut: cleanRut,
      phone: user.phone || null,
      role: backendRole, // Enviar SOLO el nombre del rol (no roleId)
      areas: user.areas,
      warehouses: user.warehouses,
    };
  }

  async findAll(tenantId: string, page: number = 1, limit: number = 10): Promise<import('@/domain/repositories/IUserRepository').PaginatedResponse<User>> {
    try {
      const url = `/users?page=${page}&limit=${limit}`;
      console.log('🌐 API Call:', url);
      const response = await apiClient.get<any>(url, true);
      console.log('📦 API Response:', response);
      
      // El backend devuelve estructura paginada:
      // { data: [...], page: 1, limit: 10, totalPages: 2, total: 17, hasNext: true, hasPrev: false }
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
      
      // El backend puede devolver array directo o { data: [...] }
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

  async findByRole(roleName: string, tenantId: string): Promise<{ data: User[]; page: number; limit: number | null; totalPages: number; total: number; hasNext: boolean; hasPrev: boolean }> {
    try {
      console.log(`🔍 Fetching users with role: ${roleName}`);
      
      // Cargar roles si no están en caché
      await roleService.loadRoles();
      
      // Obtener el ID del rol por nombre
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
      
      // Llamar al endpoint con filtro de roleId
      const response = await apiClient.get<any>(`/users?roleId=${roleId}`, true);
      console.log('📦 Users by role response:', response);
      
      // El backend devuelve estructura paginada
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
      
      // Cargar roles si no están cargados
      console.log('🔄 Loading roles...');
      await roleService.loadRoles();
      
      // Obtener roleId
      let roleId = roleService.getRoleIdByName(backendRole);
      console.log('🔑 Role ID found:', roleId);
      
      // Si no se encuentra, lanzar error descriptivo
      if (!roleId) {
        const allRoles = roleService.getAllRoles();
        console.error('❌ Role ID not found. Available roles:', allRoles);
        throw new Error(`Role ID not found for role: ${backendRole}. Available roles: ${allRoles.map(r => r.name).join(', ')}`);
      }
      
      // Limpiar RUT: quitar puntos y guiones
      const cleanRut = user.rut ? user.rut.replace(/[.-]/g, '') : null;
      
      const payload = {
        email: user.email,
        password: 'TempPassword123!@#',
        firstName: user.name,
        lastName: user.lastName,
        rut: cleanRut,
        phone: user.phone || null,
        roleId: roleId,
      };
      
      const response = await apiClient.post<any>('/users', payload, true);
      
      // El backend puede devolver diferentes estructuras
      const backendUser = response.user || response;
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
      const payload: any = {};
      if (updates.name) payload.firstName = updates.name;
      if (updates.lastName) payload.lastName = updates.lastName;
      if (updates.email) payload.email = updates.email;
      
      // Limpiar RUT: quitar puntos y guiones antes de enviar
      if (updates.rut !== undefined) {
        payload.rut = updates.rut ? updates.rut.replace(/[.-]/g, '') : null;
      }
      
      if (updates.phone !== undefined) payload.phone = updates.phone || null;
      
      // Mapear status a isEnabled (backend usa isEnabled en lugar de status)
      if (updates.status !== undefined) {
        payload.isEnabled = updates.status === 'HABILITADO';
      }
      
      // ⚠️ IMPORTANTE: El endpoint PUT /users/{id} NO acepta 'role'
      // El rol no se puede actualizar después de la creación
      // Solo se pueden actualizar: email, firstName, lastName, rut, phone, isEnabled
      
      // No enviar areas/warehouses/role en el payload del usuario
      const hasAssignments = updates.areas !== undefined || updates.warehouses !== undefined;
      
      // Obtener asignaciones anteriores si necesitamos procesarlas
      let previousAreas: string[] = [];
      let previousWarehouses: string[] = [];
      
      if (hasAssignments) {
        const existingUser = await this.findById(id, tenantId);
        if (existingUser) {
          previousAreas = existingUser.areas || [];
          previousWarehouses = existingUser.warehouses || [];
        }
      }
      
      const backendUser = await apiClient.put<BackendUser, typeof payload>(`/users/${id}`, payload, true);
      const updatedUser = this.mapBackendUser(backendUser);
      
      // Procesar asignaciones si se proporcionaron
      if (hasAssignments) {
        updatedUser.areas = updates.areas || [];
        updatedUser.warehouses = updates.warehouses || [];
        
        // Usar el rol actualizado o el existente
        const userRole = updates.role || updatedUser.role;
        await this.processAssignments(updatedUser, userRole, previousAreas, previousWarehouses);
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async disable(id: string, tenantId: string): Promise<void> {
    try {
      // Deshabilitar usuario actualizando isEnabled a false
      await apiClient.put(`/users/${id}`, { isEnabled: false }, true);
    } catch (error) {
      console.error('Error disabling user:', error);
      throw error;
    }
  }

  async checkEmailExists(email: string, tenantId: string, excludeUserId?: string): Promise<boolean> {
    try {
      // TODO: Backend debe implementar este endpoint
      // Por ahora, hacemos un workaround obteniendo todos los usuarios
      const response = await this.findAll(tenantId);
      return response.data.some((u: User) => 
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
