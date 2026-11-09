# @sudobility/characterbuilder_client

Network client and react-query hooks for CharacterBuilder — the typed door to
`characterbuilder_api`, consumed by `characterbuilder_lib` and the app. Browser
or Node library (ESM only); `react` and `@tanstack/react-query` are peer deps.
All DTOs come from `@sudobility/characterbuilder_types`. Modeled on
`screenwriter_client` minus the Yjs collaborative-sync layer.

## What's in it

- **`CharacterBuilderClient`** (`src/network/`) — typed methods over an injected
  `NetworkClient`. Every method returns the unwrapped `data` from the API's
  `{ success, data }` envelope and throws an `ApiError` on failure.
  - account: `me`
  - characters: `listCharacters`, `getCharacter`, `createCharacter`,
    `updateCharacter`, `deleteCharacter`
  - character images: `listCharacterImages`, `updateCharacterImageNote`,
    `removeCharacterImage`
  - generation: `compose`, `describe`, `analyze`, `getDistributions`,
    `generate`, `generateSheet`, `getVisualStyles`, `listGenerations`,
    `getGeneration`, `getImage`, `getImageBytes`
  - credits: `getBalance`, `getProducts`, `devTopUp` (balance/store now live in
    the shared consumables stack over `/api/v1/consumables/*`)
- **Errors** (`src/errors/`) — `ApiError` (with `code`, `status`, `details`),
  the `InsufficientCreditsError` subclass (402, exposes `required`/`balance`),
  `apiErrorFrom`, and the `isApiError`/`isInsufficientCredits` guards.
- **Hooks** (`src/hooks/`) — `CharacterBuilderClientProvider` /
  `useCharacterBuilderClient`, the `queryKeys` factory, and:
  - queries: `useMe`, `useCharacters`, `useCharacter`, `useCharacterImages`,
    `useImage`, `useGenerations`, `useGeneration`
  - mutations: `useCreateCharacter`, `useUpdateCharacter`, `useDeleteCharacter`,
    `useUpdateCharacterImageNote`, `useRemoveCharacterImage`, `useCompose`,
    `useDescribe`, `useAnalyze`, `useDistributions`, `useGenerate`,
    `useGenerateSheet`

  Mutations invalidate the matching list keys; generations also invalidate
  `balance` and `me`. `useGeneration`/`useGenerations` poll (2s / 3s) while a job
  is pending or running and stop once it is terminal.

## Install

The `@sudobility` scope resolves to GitHub Packages (see `.npmrc`), so you need a
GitHub token with `read:packages` exported as `GH_PACKAGES_READ_TOKEN` (or
configured in your `~/.npmrc`) before installing.

```bash
bun install
```

## Develop

```bash
bun run typecheck     # tsc --noEmit
bun run test:unit     # vitest run
bun run lint          # eslint src
bun run format        # prettier --write "src/**/*.ts"
bun run build         # vite (ESM bundle) + tsc (.d.ts) + fix-esm-imports
```

`typecheck` and `test:unit` resolve `@sudobility/characterbuilder_types` from a
sibling `../characterbuilder_types/src` checkout when present (via tsconfig
`paths` / a vitest alias), otherwise from the installed package.

## Use

```ts
const client = new CharacterBuilderClient({
  network: createFetchNetworkClient(), // or inject your own NetworkClient
  baseUrl: 'http://localhost:8040',    // API origin, no /api/v1 suffix
  getToken: (forceRefresh) => getFirebaseIdToken(forceRefresh), // null = signed out
  clientTag: 'web/0.1.0',              // optional, sent as X-Client
});
```

Wrap the React tree in `CharacterBuilderClientProvider` (inside your
`QueryClientProvider`) to use the hooks. The client sends the bearer token,
retries once after a `401` with a refreshed token, and unwraps the envelope.
