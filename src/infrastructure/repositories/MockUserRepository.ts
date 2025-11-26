import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { User } from '@/domain/entities/User';

const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Carlos',
    lastName: 'González',
    email: 'carlos.gonzalez@kreatech.cl',
    rut: '12345678-9',
    phone: '+56 9 1234 5678',
    role: 'ADMIN',
    status: 'HABILITADO',
    areas: ['1', '2'],
    warehouses: ['1', '2'],
    tenantId: 'kreatech-demo',
  },
  {
    id: '2',
    name: 'María',
    lastName: 'López',
    email: 'maria.lopez@kreatech.cl',
    rut: '23456789-0',
    phone: '+56 9 2345 6789',
    role: 'JEFE',
    status: 'HABILITADO',
    areas: ['1'],
    warehouses: ['1'],
    tenantId: 'kreatech-demo',
  },
  {
    id: '3',
    name: 'Pedro',
    lastName: 'Martínez',
    email: 'pedro.martinez@kreatech.cl',
    rut: '34567890-1',
    phone: '+56 9 3456 7890',
    role: 'SUPERVISOR',
    status: 'HABILITADO',
    areas: ['2'],
    warehouses: ['2', '3'],
    tenantId: 'kreatech-demo',
  },
  {
    id: '4',
    name: 'Ana',
    lastName: 'Silva',
    email: 'ana.silva@kreatech.cl',
    rut: '45678901-2',
    phone: '+56 9 4567 8901',
    role: 'SUPERVISOR',
    status: 'DESHABILITADO',
    areas: ['3'],
    warehouses: ['4'],
    tenantId: 'kreatech-demo',
  },
  {
    id: '5',
    name: 'Luis',
    lastName: 'Ramírez',
    email: 'luis.ramirez@kreatech.cl',
    rut: '56789012-3',
    phone: '+56 9 5678 9012',
    role: 'JEFE',
    status: 'HABILITADO',
    areas: ['2', '3'],
    warehouses: ['3', '4'],
    tenantId: 'kreatech-demo',
  },
];

let users = [...MOCK_USERS];

export class MockUserRepository implements IUserRepository {
  async findAll(tenantId: string): Promise<User[]> {
    await this.simulateLatency();
    return users.filter(u => u.tenantId === tenantId);
  }

  async findById(id: string, tenantId: string): Promise<User | null> {
    await this.simulateLatency();
    return users.find(u => u.id === id && u.tenantId === tenantId) || null;
  }

  async create(user: Omit<User, 'id'>): Promise<User> {
    await this.simulateLatency();
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
    };
    users.push(newUser);
    return newUser;
  }

  async update(id: string, updates: Partial<User>, tenantId: string): Promise<User> {
    await this.simulateLatency();
    const index = users.findIndex(u => u.id === id && u.tenantId === tenantId);
    if (index === -1) throw new Error('User not found');
    users[index] = { ...users[index], ...updates };
    return users[index];
  }

  async disable(id: string, tenantId: string): Promise<void> {
    await this.simulateLatency();
    const index = users.findIndex(u => u.id === id && u.tenantId === tenantId);
    if (index !== -1) {
      users[index].status = 'DESHABILITADO';
    }
  }

  async checkEmailExists(email: string, tenantId: string, excludeUserId?: string): Promise<boolean> {
    await this.simulateLatency();
    const emailLower = email.toLowerCase();
    return users.some(u => 
      u.email.toLowerCase() === emailLower && 
      u.tenantId === tenantId &&
      u.id !== excludeUserId
    );
  }

  async verifyPassword(userId: string, password: string, tenantId: string): Promise<boolean> {
    await this.simulateLatency();
    // En mock: verificar que el usuario exista
    const user = users.find(u => u.id === userId && u.tenantId === tenantId);
    if (!user) return false;
    
    // Simular validación - en producción debe hacer hash comparison
    // Para testing, cualquier contraseña con al menos 6 caracteres es válida
    return password.length >= 6;
  }

  async changePassword(userId: string, newPassword: string, tenantId: string): Promise<void> {
    await this.simulateLatency();
    const user = users.find(u => u.id === userId && u.tenantId === tenantId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    // En mock: solo simulamos el cambio (en producción se hashearía y guardaría)
    console.log(`Contraseña cambiada para usuario ${userId}`);
  }

  private simulateLatency(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}
