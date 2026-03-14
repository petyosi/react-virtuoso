import { join, resolve } from 'node:path'

import react from '@vitejs/plugin-react'
/// <reference types="vitest" />
import { defineConfig, searchForWorkspaceRoot } from 'vite'
import dts from 'vite-plugin-dts'

const inLadle = process.env.LADLE === 'true'

const define = {
  PACKAGE_TIMESTAMP: Date.now(),
}
// https://vitejs.dev/config/
export default inLadle
  ? defineConfig({
      define,
      server: {
        fs: {
          allow: [
            // search up for workspace root
            searchForWorkspaceRoot(join(process.cwd(), '../../')),
          ],
        },
      },
    })
  : defineConfig({
      define,
      plugins: [
        react(),
        dts({
          rollupTypes: true,
          staticImport: true,
          compilerOptions: { skipLibCheck: true },
        }),
      ],
      build: {
        minify: true,
        lib: {
          entry: resolve(import.meta.dirname, 'src/index.ts'),
          formats: ['es'],
          fileName: 'index',
        },
        rollupOptions: {
          output: {
            exports: 'named',
          },
          external: [
            'react',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
            '@virtuoso.dev/reactive-engine-react',
            '@virtuoso.dev/reactive-engine-core',
            '@ladle/react',
          ],
        },
      },
    })
