# CLAUDE.md — characterbuilder_client

Network client + react-query hooks. Layer 3 of five. Browser/Node library, ESM
only; `react` and `@tanstack/react-query` are peer deps. Modeled on
`screenwriter_client` minus the Yjs sync layer.

## Commands (all verified)
- `bun run typecheck` — `tsc --noEmit`
- `bun run test:unit` — `vitest run`
- `bun run lint` — `eslint src`
- `bun run format` — `prettier --write "src/**/*.ts"`
- `bun run build` — `vite` bundle (ESM, externalizes react/react-query/types) +
  `tsc -p tsconfig.build.json` for `.d.ts` + `node scripts/fix-esm-imports.mjs`.

## Shape
- `src/network/network-client.ts` — `NetworkClient` interface +
  `createFetchNetworkClient`. Library code never calls `fetch` directly; it
  receives a `NetworkClient` (status resolves for any HTTP code; rejects only on
  transport failure). Bodies are `Uint8Array`.
- `src/network/characterbuilder-client.ts` — `CharacterBuilderClient`: `url()` +
  `send()` (token header, optional `X-Client`, one 401 retry with
  `getToken(true)`) + `json()`/`fail()` (envelope unwrap / `apiErrorFrom`). One
  method per endpoint; paths come from `ROUTES` + the `/api/v1` base.
- `src/errors/` — `ApiError`, `InsufficientCreditsError`, `apiErrorFrom`, guards.
- `src/hooks/` — `CharacterBuilderClientProvider`/`useCharacterBuilderClient`,
  `queryKeys` (every key under `["characterbuilder"]`), query/mutation hooks.
  Mutations invalidate the matching list keys (+ balance/me after a generation).
  `useGeneration`/`useGenerations` poll (2s/3s) until a job is terminal.

## Rules & gotchas
- All DTOs come from `@sudobility/characterbuilder_types`. Client params use the
  `*Input` variants (optional fields; the server defaults them).
- Never hard-code a path — use `ROUTES`.
- `no-undef` is off for TS (TypeScript checks identifiers; the rule trips on DOM
  types). Globals used in TS must still be listed in `eslint.config.js`.
- Credits migrated OUT of this client: the balance/store/ledger are the shared
  consumables stack (`@sudobility/consumables_client` + `_pages`). The native
  `useBalance`/`useCreditProducts`/`useDevTopUp` hooks were removed — do not
  re-add them. The client still has `getBalance`/`getProducts`/`devTopUp`
  methods, but no hooks wrap them.
- `@sudobility/characterbuilder_types` is a published dep (version range in
  `package.json`), NOT a `file:` link. tsconfig `paths` and the vitest alias
  point typecheck/tests at a sibling `../characterbuilder_types/src` checkout
  when it exists, else the installed package. Keep the two in sync locally.
- `@sudobility` resolves to GitHub Packages (`.npmrc`); installs need a
  `read:packages` token (`GH_PACKAGES_READ_TOKEN`).
- `scripts/fix-esm-imports.mjs` rewrites `tsc`'s extensionless/bundler-style
  relative specifiers to explicit `.js`/`index.js` paths so Node's ESM loader
  can resolve the output. It is idempotent and never fails the build.
