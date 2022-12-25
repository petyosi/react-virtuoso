import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const ext = {
  cjs: 'js',
  es: 'm.js',
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
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
})
