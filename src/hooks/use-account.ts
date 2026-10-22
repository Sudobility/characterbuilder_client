import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCharacterBuilderClient } from './client-context';
import { queryKeys } from './query-keys';

/** The signed-in user's profile + credit balance. */
export function useMe(enabled = true) {
  const client = useCharacterBuilderClient();
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => client.me(),
    enabled,
  });
}

export function useBalance(enabled = true) {
  const client = useCharacterBuilderClient();
  return useQuery({
    queryKey: queryKeys.balance(),
    queryFn: () => client.getBalance(),
    enabled,
  });
}

export function useCreditProducts() {
  const client = useCharacterBuilderClient();
  return useQuery({
    queryKey: queryKeys.products(),
    queryFn: () => client.getProducts(),
    staleTime: 60 * 60 * 1000,
  });
}

/**
 * Dev-only: grant credits to the signed-in user (local testing). Succeeds only
 * when the server runs with AUTH_TEST_MODE=1; otherwise the request 403s.
 * Refreshes the balance and profile on success.
 */
export function useDevTopUp() {
  const client = useCharacterBuilderClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (credits?: number) => client.devTopUp(credits),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.balance() });
      qc.invalidateQueries({ queryKey: queryKeys.me() });
    },
  });
}
