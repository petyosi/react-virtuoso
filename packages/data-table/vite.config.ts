import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
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
      plugins: [tailwindcss()],
      resolve: {
        alias: [
          {
            find: '@/components/ui/data-table/column-reorder',
            replacement: resolve(import.meta.dirname, '../../apps/virtuoso.dev/registry/new-york/data-table/column-reorder/index.ts'),
          },
          {
            find: '@/components/ui/data-table',
            replacement: resolve(import.meta.dirname, '../../apps/virtuoso.dev/registry/new-york/data-table/data-table.tsx'),
          },
          { find: '@/', replacement: `${resolve(import.meta.dirname, '../../apps/virtuoso.dev/src')}/` },
          { find: '@virtuoso.dev/data-table/styles.css', replacement: resolve(import.meta.dirname, 'src/styles.css') },
          {
            find: '@virtuoso.dev/data-table/column-reorder',
            replacement: resolve(import.meta.dirname, 'src/features/column-reorder/index.ts'),
          },
          { find: '@virtuoso.dev/data-table', replacement: resolve(import.meta.dirname, 'src/index.ts') },
        ],
      },
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
        {
          name: 'emit-styles',
          generateBundle() {
            this.emitFile({
              type: 'asset',
              fileName: 'styles.css',
              source: readFileSync(resolve(import.meta.dirname, 'src/styles.css'), 'utf8'),
            })
          },
        },
      ],
      build: {
        minify: true,
        lib: {
          entry: {
            index: resolve(import.meta.dirname, 'src/index.ts'),
            'column-reorder': resolve(import.meta.dirname, 'src/features/column-reorder/index.ts'),
          },
          formats: ['es'],
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
