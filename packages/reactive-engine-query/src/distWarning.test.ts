// oxlint-disable import/no-nodejs-modules -- this test bundles a fixture with Vite and runs it in a Node sandbox
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'

import { build } from 'vite'
import { describe, expect, it } from 'vitest'

import type { Rollup } from 'vite'

// MUT-1 evidence: the development warning survives bundling, and the built package loads without a `process` global.
// Each case bundles a fixture against the built dist, then runs it in a sandbox that has no `process`.

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const entry = fileURLToPath(new URL('test/fixture/warningEntry.js', import.meta.url))
const invariantStub = fileURLToPath(new URL('test/fixture/invariantStub.js', import.meta.url))

async function bundle(nodeEnv: 'development' | 'production' | null) {
  const output = (await build({
    build: {
      minify: false,
      rollupOptions: { input: entry, output: { format: 'iife' } },
      write: false,
    },
    configFile: false,
    // With null, the expression is kept as written, as when the package is loaded without a bundler.
    define: { 'process.env.NODE_ENV': nodeEnv === null ? 'process.env.NODE_ENV' : JSON.stringify(nodeEnv) },
    logLevel: 'silent',
    // tiny-invariant (a core dependency) reads process.env.NODE_ENV on load, so core itself needs a bundler or a
    // process global. Without replacement, stub it, so the case checks this package's own code.
    resolve: nodeEnv === null ? { alias: { 'tiny-invariant': invariantStub } } : {},
    root: packageRoot,
  })) as Rollup.RollupOutput
  const [chunk] = output.output
  return chunk.code
}

function runWithoutProcess(code: string) {
  const warnings: unknown[][] = []
  const sandbox = {
    AbortController,
    clearTimeout,
    console: { error: () => undefined, log: () => undefined, warn: (...args: unknown[]) => warnings.push(args) },
    fixtureDone: false,
    queueMicrotask,
    setTimeout,
  }
  runInNewContext(code, sandbox)
  expect(sandbox.fixtureDone).toBe(true)
  return warnings
}

// These tests need a build. Locally they skip without one; in CI, which builds first, a missing build fails them.
const skipWithoutDist = !existsSync(`${packageRoot}/dist/index.js`) && process.env.CI === undefined

describe('the development warning in bundled code', () => {
  it.skipIf(skipWithoutDist)(
    'warns in a development bundle, not in a production bundle, and loads without process',
    async () => {
      const development = await bundle('development')
      expect(development).not.toContain('process.env.NODE_ENV')
      expect(runWithoutProcess(development)).toHaveLength(1)

      const production = await bundle('production')
      expect(runWithoutProcess(production)).toHaveLength(0)

      const unbundled = await bundle(null)
      expect(unbundled).toContain('process.env.NODE_ENV')
      // No `process` global: the check reports production instead of throwing.
      expect(runWithoutProcess(unbundled)).toHaveLength(0)
    },
    60_000
  )
})
