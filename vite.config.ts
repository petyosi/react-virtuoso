/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

const ext = {
  cjs: 'cjs',
  es: 'mjs',
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' }), dts({ rollupTypes: true })],
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'chrome79', 'safari14'],
    minify: 'terser',
    lib: {
      entry: ['src/index.tsx'],
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${ext[format]}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@virtuoso.dev/urx', '@virtuoso.dev/react-urx'],
    },
  },
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
  },
})
