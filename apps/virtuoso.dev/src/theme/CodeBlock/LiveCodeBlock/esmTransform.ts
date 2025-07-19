import * as esbuild from 'esbuild-wasm'

let esBuildInitializePromise: Promise<boolean> | null = null

const starImportRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g
const importRegex = /import\s+({[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g
const effectImportRegex = /import\s+['"]([^'"]+)['"]/g

export async function transformToFunctionBody(code: string) {
  if (esBuildInitializePromise === null) {
    esBuildInitializePromise = new Promise<boolean>((resolve, reject) => {
      esbuild
        .initialize({
          wasmURL: 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.25.1/esbuild.wasm',
        })
        .then(() => {
          resolve(true)
        })
        .catch(() => {
          reject(new Error('Failed to initialize esbuild'))
        })
    })
  }
  try {
    await esBuildInitializePromise
  } catch {
    console.warn('re-initializing esbuild')
  }

  try {
    const imports = Array.from(code.matchAll(importRegex))
    const startImports = Array.from(code.matchAll(starImportRegex))

    const packages = [...imports, ...startImports].map((match) => match[2]).filter((pkg) => pkg !== 'react')

    // First convert imports to assignments
    const codeWithAssignments = convertExportsToAssignments(convertImportsToAssignments(code))

    const result = await esbuild.transform(codeWithAssignments, {
      loader: 'tsx',
      format: 'iife', // Using IIFE since AMD is not directly supported
      target: 'es2015',
    })

    const functionBodyCode = `
const passedModules = arguments[0]
const React = passedModules['react']

let defaultExport

${result.code}

return defaultExport`

    return {
      type: 'success',
      code: functionBodyCode,
      packages,
    }
  } catch (e) {
    console.error('Error during transformation:', e)
    if (e instanceof Error) {
      return {
        type: 'error',
        error: e.message,
      }
    }
    return {
      type: 'error',
      error: 'something went wrong',
    }
  }
}

function convertImportsToAssignments(code: string) {
  return code
    .replaceAll(starImportRegex, `const $1 = passedModules['$2']`)
    .replaceAll(importRegex, `const $1 = passedModules['$2']`)
    .replaceAll(effectImportRegex, ``)
}

function convertExportsToAssignments(code: string) {
  const defaultExportRegex = /export\s+default\s+({[^}]+}|\*\s+as\s+\w+|\w+)/g
  return code.replace(defaultExportRegex, 'defaultExport = $1')
}
