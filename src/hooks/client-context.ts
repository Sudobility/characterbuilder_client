import {
  createContext,
  createElement,
  useContext,
  type ReactNode,
} from 'react';
import type { CharacterBuilderClient } from '../network/characterbuilder-client';

const ClientContext = createContext<CharacterBuilderClient | null>(null);

/** Provide one client to every hook below (place inside `QueryClientProvider`). */
export function CharacterBuilderClientProvider(props: {
  client: CharacterBuilderClient;
  children?: ReactNode;
}) {
  return createElement(
    ClientContext.Provider,
    { value: props.client },
    props.children
  );
}

export function useCharacterBuilderClient(): CharacterBuilderClient {
  const c = useContext(ClientContext);
  if (!c)
    throw new Error(
      'useCharacterBuilderClient: wrap the tree in <CharacterBuilderClientProvider>'
    );
  return c;
}
