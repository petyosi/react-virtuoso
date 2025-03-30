import react from '@vitejs/plugin-react-swc'
import { resolve } from 'node:path'
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
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          fileName: 'index',
          formats: ['es'],
          name: 'Virtuoso',
        },
        minify: true,
        rollupOptions: {
          external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', '@virtuoso.dev/gurx', '@ladle/react'],
          output: {
            exports: 'named',
          },
        },
      },
      define,
      plugins: [
        react(),
        dts({
          compilerOptions: { skipLibCheck: true },
          rollupTypes: true,
          staticImport: true,
        }),
      ],
    })
