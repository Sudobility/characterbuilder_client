import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateCharacterRequest,
  UpdateCharacterRequest,
} from '@sudobility/characterbuilder_types';
import { useCharacterBuilderClient } from './client-context';
import { queryKeys } from './query-keys';

export function useCharacters(query?: { limit?: number; cursor?: string }) {
  const client = useCharacterBuilderClient();
  return useQuery({
    queryKey: queryKeys.characters(query),
    queryFn: () => client.listCharacters(query),
  });
}

export function useCharacter(id: string | undefined) {
  const client = useCharacterBuilderClient();
  return useQuery({
    queryKey: queryKeys.character(id ?? ''),
    queryFn: () => client.getCharacter(id!),
    enabled: Boolean(id),
  });
}

export function useCreateCharacter() {
  const client = useCharacterBuilderClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateCharacterRequest) => client.createCharacter(req),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.characterLists() }),
  });
}

export function useUpdateCharacter() {
  const client = useCharacterBuilderClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; req: UpdateCharacterRequest }) =>
      client.updateCharacter(v.id, v.req),
    onSuccess: (character) => {
      qc.invalidateQueries({ queryKey: queryKeys.characterLists() });
      qc.setQueryData(queryKeys.character(character.id), character);
    },
  });
}

export function useDeleteCharacter() {
  const client = useCharacterBuilderClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.deleteCharacter(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.characterLists() }),
  });
}
