import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ComposeRequestInput,
  DistributionRequest,
  Generation,
  GenerateRequestInput,
  SheetRequestInput,
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

/**
 * Enqueue a generation JOB (returns immediately with status 'pending'); reserves
 * credits. Poll the returned generation with `useGeneration(id)` until terminal.
 * Invalidates balance/history right away (credits are reserved up front).
 */
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

/**
 * Enqueue a staged sheet JOB (head / body / clothed); returns immediately with
 * status 'pending' and reserves credits. Poll with `useGeneration(id)` until
 * terminal. Same cache invalidation as `useGenerate`.
 */
export function useGenerateSheet() {
  const client = useCharacterBuilderClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: SheetRequestInput) => client.generateSheet(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.generationLists() });
      qc.invalidateQueries({ queryKey: queryKeys.balance() });
      qc.invalidateQueries({ queryKey: queryKeys.me() });
    },
  });
}

/** Demographics -> per-trait probability maps (casting odds for the UI). */
export function useDistributions() {
  const client = useCharacterBuilderClient();
  return useMutation({
    mutationFn: (req: DistributionRequest) => client.getDistributions(req),
  });
}

const isTerminal = (g?: Generation) =>
  g?.status === 'succeeded' || g?.status === 'failed';

export function useGenerations(query?: { limit?: number; cursor?: string }) {
  const client = useCharacterBuilderClient();
  return useQuery({
    queryKey: queryKeys.generations(query),
    queryFn: () => client.listGenerations(query),
  });
}

/**
 * Fetch one generation and POLL while it's still pending/running (jobs are
 * async), stopping once it succeeds or fails. On each terminal transition it
 * refreshes the history list and the credit balance (a partial batch releases
 * the undelivered reserve).
 */
export function useGeneration(id: string | undefined) {
  const client = useCharacterBuilderClient();
  const qc = useQueryClient();
  return useQuery({
    queryKey: queryKeys.generation(id ?? ''),
    queryFn: async () => {
      const gen = await client.getGeneration(id!);
      if (isTerminal(gen)) {
        qc.invalidateQueries({ queryKey: queryKeys.generationLists() });
        qc.invalidateQueries({ queryKey: queryKeys.balance() });
        qc.invalidateQueries({ queryKey: queryKeys.me() });
      }
      return gen;
    },
    enabled: Boolean(id),
    refetchInterval: (query) =>
      isTerminal(query.state.data as Generation | undefined) ? false : 2000,
  });
}
