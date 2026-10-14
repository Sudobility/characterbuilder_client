/** Central query-key factory. Every key starts with `["characterbuilder"]`. */
const root = () => ['characterbuilder'] as const;

export const queryKeys = {
  all: root,
  me: () => [...root(), 'me'] as const,
  balance: () => [...root(), 'balance'] as const,
  products: () => [...root(), 'products'] as const,

  characterLists: () => [...root(), 'character-lists'] as const,
  characters: (filters?: object) =>
    [...root(), 'character-lists', filters ?? {}] as const,
  charactersAll: () => [...root(), 'character'] as const,
  character: (id: string) => [...root(), 'character', id] as const,

  generationLists: () => [...root(), 'generation-lists'] as const,
  generations: (filters?: object) =>
    [...root(), 'generation-lists', filters ?? {}] as const,
  generation: (id: string) => [...root(), 'generation', id] as const,
};
