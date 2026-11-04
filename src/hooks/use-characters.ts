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

/** Every headshot owned by a character (1:M), newest first. */
export function useCharacterImages(id: string | undefined) {
  const client = useCharacterBuilderClient();
  return useQuery({
    queryKey: queryKeys.characterImages(id ?? ''),
    queryFn: () => client.listCharacterImages(id!),
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

/** Remove a headshot from a character (clears the association; keeps the image). */
export function useUpdateCharacterImageNote() {
  const client = useCharacterBuilderClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      characterId: string;
      imageId: string;
      note: string | null;
    }) => client.updateCharacterImageNote(v.characterId, v.imageId, v.note),
    onSuccess: (image, v) => {
      qc.setQueryData(queryKeys.image(v.imageId), image);
      qc.invalidateQueries({
        queryKey: queryKeys.characterImages(v.characterId),
      });
    },
  });
}

export function useRemoveCharacterImage() {
  const client = useCharacterBuilderClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { characterId: string; imageId: string }) =>
      client.removeCharacterImage(v.characterId, v.imageId),
    onSuccess: (character, v) => {
      qc.invalidateQueries({
        queryKey: queryKeys.characterImages(v.characterId),
      });
      qc.invalidateQueries({ queryKey: queryKeys.generationLists() });
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
