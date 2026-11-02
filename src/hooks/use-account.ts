import { useQuery } from '@tanstack/react-query';
import { useCharacterBuilderClient } from './client-context';
import { queryKeys } from './query-keys';

/**
 * The signed-in user's profile.
 *
 * Credits are no longer read through this client: the balance, the store, the
 * ledger and purchasing are the shared consumables stack's
 * (`@sudobility/consumables_client` + `@sudobility/consumables_pages`, over
 * characterbuilder_api's `/api/v1/consumables/*`). The former native credit
 * hooks (`useBalance`, `useCreditProducts`, `useDevTopUp`) were removed with
 * that migration.
 */
export function useMe(enabled = true) {
  const client = useCharacterBuilderClient();
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => client.me(),
    enabled,
  });
}
