import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { luzApi } from '../../../shared/api/luz-api';

export const SESSION_QUERY_KEY = ['session'] as const;

// Usuario de la sesión actual. Si no hay sesión, la consulta falla (401) y el router manda al login.
export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: () => luzApi.me(),
    retry: false,
    staleTime: 1000 * 60,
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password, rememberMe }: { email: string; password: string; rememberMe?: boolean }) => {
      await luzApi.signIn(email, password, rememberMe);
      return luzApi.me();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, user);
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => luzApi.signOut(),
    onSettled: () => {
      queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });
}
