# @sudobility/characterbuilder_client

Network client and react-query hooks for CharacterBuilder — the typed door to
`characterbuilder_api`, consumed by `characterbuilder_lib` and the app.

- **`CharacterBuilderClient`** (network/) — typed methods over an injected
  `NetworkClient`: `me`, characters CRUD, `compose`, `generate`, generation
  history, `getImageBytes`, `getBalance`, `getProducts`. Unwraps the API
  envelope; maps failures to `ApiError` (e.g. `InsufficientCreditsError`);
  retries once after a 401 with a refreshed token.
- **Hooks** (hooks/) — `CharacterBuilderClientProvider` + `useMe`, `useBalance`,
  `useCreditProducts`, `useCharacters`/`useCharacter`/`useCreate|Update|DeleteCharacter`,
  `useCompose`, `useGenerate`, `useGenerations`/`useGeneration`. All keys from
  `queryKeys`.

```bash
bun install
bun run typecheck && bun run test:unit && bun run build
```

Inject your own `NetworkClient` (or use `createFetchNetworkClient()`), a
`baseUrl`, and a `getToken()` that returns the Firebase ID token. Modeled on
`screenwriter_client` (no Yjs sync — CharacterBuilder has no collaborative doc).
