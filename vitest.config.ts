import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Prefer the sibling repo's source when checked out alongside this one (local dev);
// otherwise fall back to the published @sudobility/characterbuilder_types in node_modules.
const typesSrc = fileURLToPath(
  new URL('../characterbuilder_types/src/index.ts', import.meta.url)
);

export default defineConfig({
  resolve: {
    alias: existsSync(typesSrc)
      ? { '@sudobility/characterbuilder_types': typesSrc }
      : {},
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    environment: 'happy-dom',
    testTimeout: 15000,
  },
});
