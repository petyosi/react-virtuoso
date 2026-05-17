import githubDark from '@shikijs/themes/github-dark'
import githubLight from '@shikijs/themes/github-light'
import { createHighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'

import type { HighlighterCore } from 'shiki/core'

type Highlighter = HighlighterCore

let highlighterInstance: Highlighter | null = null
let highlighterPromise: null | Promise<Highlighter> = null

export function getShikiHighlighter(): Promise<Highlighter> {
  if (highlighterInstance) {
    return Promise.resolve(highlighterInstance)
  }

  highlighterPromise ??= createHighlighterCore({
    engine: createOnigurumaEngine(import('shiki/wasm')),
    langs: [
      import('@shikijs/langs/typescript'),
      import('@shikijs/langs/javascript'),
      import('@shikijs/langs/tsx'),
      import('@shikijs/langs/jsx'),
      import('@shikijs/langs/json'),
      import('@shikijs/langs/bash'),
      import('@shikijs/langs/css'),
    ],
    themes: [githubDark, githubLight],
  }).then((highlighter) => {
    highlighterInstance = highlighter
    return highlighter
  })

  return highlighterPromise
}
