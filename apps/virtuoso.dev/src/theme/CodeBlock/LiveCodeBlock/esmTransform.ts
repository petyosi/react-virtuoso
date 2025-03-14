import * as esbuild from 'esbuild-wasm'

let esBuildInitializePromise = null

const starImportRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
const importRegex = /import\s+({[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;

export async function transformToFunctionBody(code: string) {

  if (esBuildInitializePromise === null) {
    esBuildInitializePromise = new Promise<void>((resolve, reject) => {
      esbuild
        .initialize({
          wasmURL: 'https://unpkg.com/esbuild-wasm@0.25.0/esbuild.wasm',
        })
        .then(() => resolve())
        .catch(() => reject())
    })
  }
  try {
    await esBuildInitializePromise
  } catch {
    console.warn('re-initializing esbuild')
  }


  try {
    const imports = Array.from(code.matchAll(importRegex));
    const startImports = Array.from(code.matchAll(starImportRegex));

    const packages = [...imports, ...startImports].map(match => match[2]).filter(pkg => pkg !== 'react')


    // First convert imports to assignments
    const codeWithAssignments = convertExportsToAssignments(convertImportsToAssignments(code));

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

return defaultExport`;

    return {
      type: 'success',
      code: functionBodyCode,
      packages,
    }
  } catch (e) {
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

  return code.replaceAll(starImportRegex, `const $1 = passedModules['$2']`).replaceAll(importRegex, `const $1 = passedModules['$2']`)
}

function convertExportsToAssignments(code: string) {
  const defaultExportRegex = /export\s+default\s+({[^}]+}|\*\s+as\s+\w+|\w+)/g;
  return code.replace(defaultExportRegex, 'defaultExport = $1');
}
