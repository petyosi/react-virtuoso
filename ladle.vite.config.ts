/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@virtuoso.dev/urx', '@virtuoso.dev/react-urx'],
    },
  },
})
