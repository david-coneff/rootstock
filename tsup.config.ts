import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'web/index': 'src/adapters/web/index.ts',
    'pwa/index': 'src/adapters/pwa/index.ts',
    'tauri/index': 'src/adapters/tauri/index.ts',
  },
  format: ['esm'],
  target: 'es2022',
  dts: true,
  clean: true,
  sourcemap: true,
  // Adapters reach platform APIs via peer deps; never bundle them. This is the
  // other half of the per-target story: the Tauri code stays out of any build
  // that doesn't import the tauri entry.
  external: [/^@tauri-apps\//],
});
