import * as esbuild from 'esbuild-wasm'

import { importMap } from './extraImports'

let esBuildInitializePromise: null | Promise<boolean> = null

const externalPackages = new Set(Object.keys(importMap))

export type BundleResult = { code: string; packages: string[]; type: 'success' } | { error: string; type: 'error' }

function resolveVirtualPath(path: string, files: Record<string, string>): string | undefined {
  if (path in files) {
    return path
  }
  for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
    if (path + ext in files) {
      return path + ext
    }
  }
  return undefined
}

function virtualFsPlugin(files: Record<string, string>, entryPoint: string): esbuild.Plugin {
  return {
    name: 'virtual-fs',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === 'entry-point') {
          return { namespace: 'virtual', path: entryPoint }
        }

        if (args.path.startsWith('./') || args.path.startsWith('../')) {
          const relative = args.path.replace(/^\.\//, '')
          const resolved = resolveVirtualPath(relative, files)
          if (resolved !== undefined) {
            return { namespace: 'virtual', path: resolved }
          }
          return { errors: [{ text: `Could not resolve "${args.path}"` }] }
        }

        if (externalPackages.has(args.path)) {
          return { external: true, path: args.path }
        }

        return { errors: [{ text: `Cannot resolve package "${args.path}" — add it to importMap in extraImports.ts` }] }
      })

      build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args) => {
        const contents = files[args.path]
        if (contents === undefined) {
          return { errors: [{ text: `File "${args.path}" not found` }] }
        }
        const ext = args.path.split('.').pop() ?? 'tsx'
        const loaderMap: Record<string, esbuild.Loader> = { js: 'js', jsx: 'jsx', ts: 'ts', tsx: 'tsx' }
        return { contents, loader: loaderMap[ext] ?? 'tsx' }
      })
    },
  }
}

function extractExternalPackages(files: Record<string, string>): string[] {
  const importRegex = /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g
  const packages = new Set<string>()
  for (const code of Object.values(files)) {
    for (const match of code.matchAll(importRegex)) {
      const pkg = match[1]!
      if (!pkg.startsWith('.') && pkg !== 'react' && pkg !== 'react/jsx-runtime') {
        packages.add(pkg)
      }
    }
  }
  return [...packages]
}

export async function bundleCode(files: Record<string, string>, entryPoint: string): Promise<BundleResult> {
  esBuildInitializePromise ??= new Promise<boolean>((resolve, reject) => {
    esbuild
      .initialize({
        wasmURL: 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.27.0/esbuild.wasm',
      })
      .then(() => {
        resolve(true)
        return undefined
      })
      .catch(() => {
        reject(new Error('Failed to initialize esbuild'))
      })
  })

  try {
    await esBuildInitializePromise
  } catch {
    console.warn('re-initializing esbuild')
  }

  try {
    const result = await esbuild.build({
      bundle: true,
      entryPoints: [entryPoint],
      format: 'iife',
      globalName: '__exports',
      jsx: 'automatic',
      plugins: [virtualFsPlugin(files, entryPoint)],
      target: 'es2020',
      write: false,
    })

    let code = result.outputFiles[0]!.text

    // Replace esbuild's multi-line __require shim with our module lookup.
    // The shim contains "Dynamic require" text and ends with `});`
    code = code.replace(/var __require = [\s\S]*?Dynamic require[\s\S]*?\}\);/, 'var __require = (name) => passedModules[name];')

    code = `const passedModules = arguments[0]\n${code}\nreturn __exports.default`

    const packages = extractExternalPackages(files)

    return { code, packages, type: 'success' }
  } catch (e) {
    if (e instanceof Error) {
      return { error: e.message, type: 'error' }
    }
    return { error: 'something went wrong', type: 'error' }
  }
}
