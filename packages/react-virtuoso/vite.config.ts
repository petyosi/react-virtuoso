import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'

const ext = {
  cjs: 'cjs',
  es: 'mjs',
}

const inLadle = process.env.LADLE !== undefined

// https://vitejs.dev/config/
export default inLadle
  ? defineConfig({
      plugins: [react()],
    })
  : defineConfig({
      build: {
        lib: {
          entry: ['src/index.tsx'],
          //@ts-expect-error not sure why
          fileName: (format) => `index.${ext[format]}`,
          formats: ['es', 'cjs'],
        },
        minify: true,
        rollupOptions: {
          external: ['react', 'react-dom', 'react/jsx-runtime'],
        },
        target: ['es2020', 'edge88', 'firefox78', 'chrome79', 'safari14'],
      },
      plugins: [react(), dts({ rollupTypes: true })],
      test: {
        environment: 'jsdom',
        include: ['test/**/*.test.{ts,tsx}'],
      },
    })
