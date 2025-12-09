import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';
import { User } from '@/domain/entities/User';
import { TENANT_ID } from '@/shared/constants';

// Query Keys
export const userKeys = {
  all: ['users', TENANT_ID] as const,
  byRole: (roleName: string) => ['users', TENANT_ID, 'role', roleName] as const,
  detail: (id: string) => ['users', TENANT_ID, id] as const,
};

/**
 * Hook para obtener todos los usuarios del tenant
 * Caché compartido entre componentes
 */
export const useUsers = () => {
  const { userRepo } = useRepositories();

  return useQuery({
    queryKey: userKeys.all,
    queryFn: () => userRepo.findAll(TENANT_ID),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener usuarios por rol específico
 * @param roleName - Nombre del rol (ej: 'JEFE_AREA')
 */
export const useUsersByRole = (roleName: string) => {
  const { userRepo } = useRepositories();

  return useQuery({
    queryKey: userKeys.byRole(roleName),
    queryFn: () => userRepo.findByRole(roleName, TENANT_ID),
    enabled: !!roleName, // Solo ejecutar si hay roleName
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook especializado para obtener jefes de área
 * Simplifica el uso común de useUsersByRole
 */
export const useJefes = () => {
  return useUsersByRole('JEFE_AREA');
};

/**
 * Hook para obtener un usuario específico por ID
 * @param userId - ID del usuario a buscar
 */
export const useUserById = (userId: string) => {
  const { userRepo } = useRepositories();

  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userRepo.findById(userId, TENANT_ID),
    enabled: !!userId,
  });
};

/**
 * Mutation para crear un nuevo usuario
 * Invalida automáticamente la caché de usuarios
 */
export const useCreateUser = () => {
  const { userRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) =>
      userRepo.create({ ...data, tenantId: TENANT_ID }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      // También invalidar todas las queries por rol
      queryClient.invalidateQueries({ queryKey: ['users', TENANT_ID, 'role'] });
    },
  });
};

/**
 * Mutation para actualizar un usuario existente
 * Invalida caché del usuario específico y lista completa
 */
export const useUpdateUser = () => {
  const { userRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      userRepo.update(id, data, TENANT_ID),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['users', TENANT_ID, 'role'] });
    },
  });
};


