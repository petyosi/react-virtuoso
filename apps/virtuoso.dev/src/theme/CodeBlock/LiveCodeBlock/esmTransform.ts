import * as esbuild from 'esbuild-wasm'

let esBuildInitializePromise = null

export async function transformToFunctionBody(code: string) {

  if (esBuildInitializePromise === null) {
    esBuildInitializePromise = new Promise<void>((resolve, reject) => {
      esbuild
        .initialize({
          wasmURL: 'https://unpkg.com/esbuild-wasm/esbuild.wasm',
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
    // First convert imports to assignments
    const codeWithAssignments = convertExportsToAssignments(convertImportsToAssignments(code));

    const result = await esbuild.transform(codeWithAssignments, {
      loader: 'tsx',
      format: 'iife', // Using IIFE since AMD is not directly supported
      target: 'es2015',
    })

    const functionBodyCode = ` const passedModules = arguments[0];\n const React = passedModules['react'];\n let defaultExport; \n${result.code}\n return defaultExport;`;

    return {
      type: 'success',
      code: functionBodyCode,
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
  const starImportRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  const importRegex = /import\s+({[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;

  return code.replaceAll(starImportRegex, `const $1 = passedModules['$2']`).replaceAll(importRegex, `const $1 = passedModules['$2']`)
}

function convertExportsToAssignments(code: string) {
  const defaultExportRegex = /export\s+default\s+({[^}]+}|\*\s+as\s+\w+|\w+)/g;
  return code.replace(defaultExportRegex, 'defaultExport = $1');
}
