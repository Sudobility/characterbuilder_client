import { useQuery } from '@tanstack/react-query';
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
