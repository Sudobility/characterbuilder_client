import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const r = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: r('src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: [
        'react',
        '@tanstack/react-query',
        '@sudobility/characterbuilder_types',
      ],
    },
    sourcemap: true,
    minify: false,
  },
});
