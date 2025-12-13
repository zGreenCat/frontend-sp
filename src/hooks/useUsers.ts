import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';
import { User, ValidateUserUniqueInput, ValidateUserUniqueResult } from '@/domain/entities/User';
import { TENANT_ID, USER_ROLES } from '@/shared/constants';
import { useAuth } from '@/hooks/use-auth'; // 👈 importante
import { ListUsers } from "@/application/usecases/user/ListUsers";
import type { CreateUserInput } from "@/shared/schemas";
import { CreateUser } from "@/application/usecases/user/CreateUser";
import { ToggleUserStatus } from '@/application/usecases/user/ToggleUserStatus';
import { UpdateUserPhone } from '@/application/usecases/user/UpdateUserPhone';
import { ValidateUserUnique } from '@/application/usecases/user/ValidateUserUnique';
import { userEnablementHistoryKeys } from './useUserEnablementHistory';
interface UsersListResult {
  users: User[];
  totalPages: number;
  totalUsers: number;
}

// Query Keys

export const userKeys = {
  all: ["users", TENANT_ID] as const,
  byRole: (roleName: string) =>
    ["users", TENANT_ID, "role", roleName] as const,
  detail: (id: string) => ["users", TENANT_ID, id] as const,
  // 👇 NUEVO
  list: (page: number, pageSize: number, currentUserId?: string) =>
    ["users", TENANT_ID, "list", page, pageSize, currentUserId] as const,
};

/**
 * Hook para obtener todos los usuarios del tenant
 * Caché compartido entre componentes
 */
export const useUsers = () => {
  const { userRepo } = useRepositories();
  const { isAuthenticated, isLoading } = useAuth();

  return useQuery({
    queryKey: userKeys.all,
    queryFn: () => userRepo.findAll(TENANT_ID),
    staleTime: 5 * 60 * 1000, // 5 minutos
    // 👇 Solo ejecuta la query cuando:
    // - ya terminó la carga de auth
    // - y el usuario está autenticado
    enabled: !isLoading && isAuthenticated,
  });
};

/**
 * Hook para obtener usuarios por rol específico
 * @param roleName - Nombre del rol (ej: 'JEFE_AREA')
 */
export const useUsersByRole = (roleName: string) => {
  const { userRepo } = useRepositories();
  const { isAuthenticated, isLoading } = useAuth();

  return useQuery({
    queryKey: userKeys.byRole(roleName),
    queryFn: () => userRepo.findByRole(roleName, TENANT_ID),
    // Solo ejecuta si hay rol, terminó auth, y está logueado
    enabled: !!roleName && !isLoading && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook especializado para obtener jefes de área
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
  const { isAuthenticated, isLoading } = useAuth();

  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userRepo.findById(userId, TENANT_ID),
    enabled: !!userId && !isLoading && isAuthenticated,
  });
};

/**
 * Crear usuario (usa CreateUser usecase)
 */
export const useCreateUserMutation = () => {
  const { userRepo, assignmentRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserInput): Promise<User> => {
      const useCase = new CreateUser(userRepo, assignmentRepo);
      const result = await useCase.execute(data);

      if (!result.ok) {
        throw new Error(result.error || "Error al crear usuario");
      }

      return result.value; // 👈 se lo devolvemos a la vista para el toast
    },
    onSuccess: () => {
      // invalidar TODAS las queries relacionadas a usuarios
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};


/**
 * Mutation para actualizar un usuario
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

export const useToggleUserStatus = () => {
  const { userRepo, auditLogRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      newStatus,
      performedBy,
    }: {
      userId: string;
      newStatus: "HABILITADO" | "DESHABILITADO";
      performedBy: string;
    }) => {
      const useCase = new ToggleUserStatus(userRepo, auditLogRepo);
      const result = await useCase.execute({
        targetUserId: userId,
        newStatus,
        performedBy,
        tenantId: TENANT_ID,
      });

      if (!result.ok) {
        throw new Error(result.error || "Error al cambiar estado del usuario");
      }

      return result.value;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(updatedUser.id),
      });
      // Invalidar historial de habilitación del usuario afectado
      queryClient.invalidateQueries({
        queryKey: userEnablementHistoryKeys.byUser(updatedUser.id),
      });
      // Invalidar historial global (por si está abierto)
      queryClient.invalidateQueries({
        queryKey: userEnablementHistoryKeys.all,
      });
    },
  });
};

export const useUpdateUserPhone = () => {
  const { userRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      phone,
    }: {
      userId: string;
      phone: string | null;
    }) => {
      const useCase = new UpdateUserPhone(userRepo);
      const result = await useCase.execute({
        userId,
        phone,
        tenantId: TENANT_ID,
      });

      if (!result.ok) {
        throw new Error(result.error || "Error al actualizar teléfono");
      }

      return result.value;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(updatedUser.id),
      });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      // si tienes auth context, aquí también podrías hacer setUser(updatedUser)
    },
  });
};

export const useValidateUserUnique = () => {
  const { userRepo } = useRepositories();

  return useMutation<ValidateUserUniqueResult, Error, ValidateUserUniqueInput>({
    mutationFn: async (payload: ValidateUserUniqueInput) => {
      const useCase = new ValidateUserUnique(userRepo);
      const result = await useCase.execute(payload);

      if (!result.ok) {
        throw new Error(result.error || "Error al validar datos del usuario");
      }

      return result.value;
    },
  });
};


/**
 * Lista de usuarios respetando la jerarquía:
 * - ADMIN: ve todos, paginados
 * - JEFE/JEFE_AREA: solo supervisores de sus áreas (sin paginación)
 * - SUPERVISOR: en la práctica devolverá lista vacía (la vista ya trata esto)
 */
export const useUsersList = (page: number, pageSize: number) => {
  const { userRepo } = useRepositories();
  const { user: currentUser } = useAuth();

  const currentUserId = currentUser?.id;

  // Rol actual como string “normalizado”
  const currentUserRoleRaw = (() => {
    if (!currentUser) return "";
    if (typeof currentUser.role === "string") return currentUser.role;
    if (
      currentUser.role &&
      typeof currentUser.role === "object" &&
      "name" in currentUser.role
    ) {
      return (currentUser.role as any).name;
    }
    return (currentUser as any).roleId || "";
  })();

  // IDs de áreas del usuario actual
  const currentUserAreasIds =
    currentUser?.areas?.map((a: any) => (typeof a === "string" ? a : a.id)) ||
    [];

  return useQuery<UsersListResult>({
    queryKey: userKeys.list(page, pageSize, currentUserId),
    enabled: !!currentUserId, // solo cuando ya sabemos quién es
    queryFn: async () => {
      // Mapear rol backend → frontend si viene raro
      const ROLE_MAP: Record<string, string> = {
        JEFE_AREA: "JEFE",
        BODEGUERO: "SUPERVISOR",
      };
      const mappedRole = ROLE_MAP[currentUserRoleRaw] || currentUserRoleRaw;
      const isJefeArea =
        mappedRole === USER_ROLES.JEFE || mappedRole === "JEFE";

      // 🟢 Caso JEFE: traer usuarios por área y filtrar supervisores
      if (isJefeArea && currentUserAreasIds.length > 0) {
        console.log(
          "👤 JEFE_AREA detected, loading users from assigned areas:",
          currentUserAreasIds
        );

        const usersByAreaPromises = currentUserAreasIds.map((areaId) =>
          (userRepo as any).findByArea(areaId)
        );

        const usersByArea = await Promise.all(usersByAreaPromises);

        const allUsers: User[] = usersByArea.flat();

        // Eliminar duplicados por id
        const uniqueUsers = Array.from(
          new Map(allUsers.map((u) => [u.id, u])).values()
        );

        const supervisors = uniqueUsers.filter((u) => {
          const uRole =
            typeof u.role === "string"
              ? u.role
              : ((u.role as any)?.name as string) || "";
          return uRole === "SUPERVISOR" || uRole === USER_ROLES.SUPERVISOR;
        });

        console.log(
          "✅ Loaded supervisors from JEFE areas:",
          supervisors.length
        );

        return {
          users: supervisors,
          totalPages: 1,
          totalUsers: supervisors.length,
        };
      }

      // 🟣 Caso ADMIN u otros: usar usecase paginado
      const listUseCase = new ListUsers(userRepo);
      const result = await listUseCase.execute(TENANT_ID, page, pageSize);

      if (!result.ok) {
  throw new Error(
    result.error || "No se pudieron obtener los usuarios del sistema"
  );
}

const pageData = result.value;
if (!pageData) {
  throw new Error("Respuesta inválida del servidor");
}

return {
  users: pageData.data,
  totalPages: pageData.totalPages,
  totalUsers: pageData.total,
};
    },
  });
};