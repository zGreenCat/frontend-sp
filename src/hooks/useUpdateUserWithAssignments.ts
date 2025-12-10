// hooks/useUpdateUserWithAssignments.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/presentation/providers/RepositoryProvider';
import { UpdateUserWithAssignments } from '@/application/usecases/user/UpdateUserWithAssignments';

export function useUpdateUserWithAssignments() {
  const { userRepo, assignmentRepo } = useRepositories();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      tenantId: string;
      updates: any; // puedes tipar como Partial<User>
    }) => {
      const useCase = new UpdateUserWithAssignments(userRepo, assignmentRepo);
      return useCase.execute(params);
    },
    onSuccess: (updatedUser) => {
      // Invalidar o actualizar caché de usuarios si quieres
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', updatedUser.id] });
    },
  });
}
