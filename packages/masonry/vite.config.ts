import { resolve } from 'node:path'
import react from '@vitejs/plugin-react-swc'
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const inLadle = process.env.LADLE === 'true'

const define = {
  PACKAGE_TIMESTAMP: new Date().getTime(),
}
// https://vitejs.dev/config/
export default inLadle
  ? defineConfig({
      define,
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
          formats: ['es'],
          name: 'Virtuoso',
          fileName: 'index',
        },
        rollupOptions: {
          output: {
            exports: 'named',
          },
          external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', '@virtuoso.dev/gurx', '@ladle/react'],
        },
      },
    })
