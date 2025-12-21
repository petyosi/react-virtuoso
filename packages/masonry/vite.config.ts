import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import dts from 'vite-plugin-dts'
import { defineConfig } from 'vitest/config'

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
        rolldownOptions: {
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
          bundleTypes: true,
          compilerOptions: { skipLibCheck: true },
          staticImport: true,
        }),
      ],
    })
