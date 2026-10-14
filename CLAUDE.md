# CLAUDE.md — characterbuilder_client

Network client + react-query hooks. Layer 3 of five. Browser/node library;
React and @tanstack/react-query are peer deps. Modeled on `screenwriter_client`
minus the Yjs sync layer.

## Shape
- `src/network/network-client.ts` — `NetworkClient` interface + `createFetchNetworkClient`.
  Library code never calls `fetch` directly; it receives a `NetworkClient`.
- `src/network/characterbuilder-client.ts` — `CharacterBuilderClient`: `url()` +
  `send()` (token header, X-Client, one 401 refresh) + `json()`/`fail()` (envelope
  unwrap / `apiErrorFrom`). One method per endpoint; paths come from `ROUTES`.
- `src/errors/` — `ApiError`, `InsufficientCreditsError`, `apiErrorFrom`, guards.
- `src/hooks/` — `CharacterBuilderClientProvider`/`useCharacterBuilderClient`,
  `queryKeys`, and the query/mutation hooks. Mutations invalidate the matching
  list keys (+ balance/me after a generation).

## Rules
- All DTOs come from `@sudobility/characterbuilder_types`. Client method params use
  the `*Input` variants (params optional; the server defaults them).
- Never hard-code a path — use `ROUTES`.
- `no-undef` is off for TS (TypeScript checks identifiers; the rule trips on DOM types).
- Build: `vite` (bundle, externalizing react/react-query/types) + `tsc` (.d.ts).
  The `@sudobility/characterbuilder_types` dep is a `file:` link; tsconfig `paths`
  points typecheck at its local `src`.
