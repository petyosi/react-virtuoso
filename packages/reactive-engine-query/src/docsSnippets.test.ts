// oxlint-disable import/no-nodejs-modules -- this test writes the docs snippets to disk and type-checks them
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

// DOC-3: every TypeScript snippet in the query docs type-checks against the built declarations. The snippets of one
// page are joined in order, after a prelude that declares what they assume, and checked as one file.

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const docs = ['docs/01.queries-and-mutations.md']

function extractSnippets(markdown: string) {
  return [...markdown.matchAll(/^```(tsx?)\n([\s\S]*?)^```$/gm)].map((match) => match[2] ?? '')
}

describe('docs snippets', () => {
  for (const doc of docs) {
    it.skipIf(!existsSync(`${packageRoot}/dist/index.d.ts`))(
      `type-check in ${doc}`,
      () => {
        const snippets = extractSnippets(readFileSync(`${packageRoot}/${doc}`, 'utf8'))
        expect(snippets.length).toBeGreaterThan(0)
        const prelude = readFileSync(`${packageRoot}/src/test/docsPrelude.ts`, 'utf8')
          .replace(/^export (?:type )?\{[^}]*\}.*$/gm, '')
          .replace(/^\/\/ Declarations.*$/m, '')
        const dir = `${packageRoot}/node_modules/.cache/docs-snippets`
        mkdirSync(dir, { recursive: true })
        const file = `${dir}/${doc.replaceAll('/', '_')}.tsx`
        writeFileSync(file, `${prelude}\n${snippets.join('\n')}\nexport {}\n`)

        const program = ts.createProgram([file], {
          jsx: ts.JsxEmit.Preserve,
          lib: ['lib.es2023.d.ts', 'lib.dom.d.ts'],
          module: ts.ModuleKind.ESNext,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          noEmit: true,
          paths: { '@virtuoso.dev/reactive-engine-query': [`${packageRoot}/dist/index.d.ts`] },
          skipLibCheck: true,
          strict: true,
          target: ts.ScriptTarget.ES2022,
        })
        const diagnostics = ts.getPreEmitDiagnostics(program).map((diagnostic) => {
          const { line } = diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start ?? 0) ?? { line: 0 }
          const text = diagnostic.file?.text.split('\n')[line] ?? ''
          return `${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}\n    at: ${text.trim()}`
        })
        expect(diagnostics).toEqual([])
      },
      60_000
    )
  }
})
