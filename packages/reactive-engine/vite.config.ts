import react from '@vitejs/plugin-react-swc'
/// <reference types="vitest/config" />
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      output: { exports: 'named' },
    },
  },
  plugins: [
    ...react(),
    dts({
      compilerOptions: { skipLibCheck: true },
      rollupTypes: true,
      staticImport: true,
    }),
  ],
})
