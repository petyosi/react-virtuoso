import type { ModuleFormat } from 'node:module'
import { join, resolve } from 'node:path'
import react from '@vitejs/plugin-react-swc'
/// <reference types="vitest" />
import { defineConfig, searchForWorkspaceRoot } from 'vite'
import dts from 'vite-plugin-dts'

const inLadle = process.env.LADLE === 'true'

const ext: Record<string, string> = {
  es: 'mjs',
  cjs: 'cjs',
}

const define = {
  PACKAGE_TIMESTAMP: new Date().getTime(),
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
          entry: resolve(__dirname, 'src/index.ts'),
          formats: ['es', 'cjs'],
          fileName: (format) => `index.${ext[format as 'es' | 'cjs']}`,
        },
        rollupOptions: {
          output: {
            exports: 'named',
          },
          external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', '@virtuoso.dev/gurx', '@ladle/react'],
        },
      },
    })
