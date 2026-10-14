import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ComposeRequestInput,
  GenerateRequestInput,
} from '@sudobility/characterbuilder_types';
import { useCharacterBuilderClient } from './client-context';
import { queryKeys } from './query-keys';

/** Compose the prompt for a spec (no credits spent) — handy for a live preview. */
export function useCompose() {
  const client = useCharacterBuilderClient();
  return useMutation({
    mutationFn: (req: ComposeRequestInput) => client.compose(req),
  });
}

/** Spend credits and generate images; invalidates balance + history on success. */
export function useGenerate() {
  const client = useCharacterBuilderClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: GenerateRequestInput) => client.generate(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.generationLists() });
      qc.invalidateQueries({ queryKey: queryKeys.balance() });
      qc.invalidateQueries({ queryKey: queryKeys.me() });
    },
  });
}

export function useGenerations(query?: { limit?: number; cursor?: string }) {
  const client = useCharacterBuilderClient();
  return useQuery({
    queryKey: queryKeys.generations(query),
    queryFn: () => client.listGenerations(query),
  });
}

export function useGeneration(id: string | undefined) {
  const client = useCharacterBuilderClient();
  return useQuery({
    queryKey: queryKeys.generation(id ?? ''),
    queryFn: () => client.getGeneration(id!),
    enabled: Boolean(id),
  });
}
