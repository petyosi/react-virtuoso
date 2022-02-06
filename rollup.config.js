import typescript from '@rollup/plugin-typescript'
import { babel } from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'

const baseSettings = {
  input: {
    index: 'src/index.tsx',
    VirtuosoGrid: 'src/components/VirtuosoGrid.ts',
    TableVirtuoso: 'src/components/TableVirtuoso.ts',
  },
  external: [/^@babel\/runtime\//, '@virtuoso.dev/react-urx', '@virtuoso.dev/urx', 'react'],
  treeshake: {
    propertyReadSideEffects: false,
  },
}

export default ({ watch }) => [
  // ECMAScript Modules build: assumes modern runtime, minimal babel settings
  {
    ...baseSettings,
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].mjs',
      chunkFileNames: 'shared.mjs',
      sourcemap: true,
      hoistTransitiveImports: false,
    },
    plugins: [
      typescript({
        declaration: false,
        outDir: 'dist',
      }),
      babel(babelSettings({ esmodules: true })),
      ...(watch ? [] : [terser(terserOptions(true))]),
    ],
  },

  // CommonJS build: transpiles recent features to somewhat recent engines
  {
    ...baseSettings,
    output: {
      dir: 'dist',
      format: 'cjs',
      chunkFileNames: 'shared.js',
      sourcemap: true,
      hoistTransitiveImports: false,
    },
    plugins: [
      typescript({ declaration: false }),
      babel(babelSettings('> 0.5%, last 2 versions, Firefox ESR, not dead, node >= 10')),
      ...(watch ? [] : [terserOptions(false)]),
    ],
  },
]

function babelSettings(targets) {
  return {
    babelrc: false,
    babelHelpers: 'runtime',
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    plugins: [['@babel/plugin-transform-runtime', { version: '^7.17.2' }]],
    presets: [['@babel/env', { targets, bugfixes: true }]],
    assumptions: { ignoreFunctionLength: true },
  }
}

function terserOptions(/** @type boolean */ modern) {
  return {
    toplevel: true,
    ecma: modern ? 2017 : 5,
    mangle: {},
    compress: {
      pure_getters: true,
      passes: 10,
    },
    format: {
      comments: /^\s*([@#]__[A-Z]__\s*$|@cc_on)/,
      preserve_annotations: true,
    },
  }
}
