import { createHighlighter, type Highlighter } from 'shiki'

let highlighterInstance: Highlighter | null = null
let highlighterPromise: null | Promise<Highlighter> = null

export async function getShikiHighlighter(): Promise<Highlighter> {
  if (highlighterInstance) {
    return highlighterInstance
  }

  highlighterPromise ??= createHighlighter({
    langs: ['typescript', 'javascript', 'tsx', 'jsx', 'json', 'bash'],
    themes: ['github-dark', 'github-light'],
  }).then((highlighter) => {
    highlighterInstance = highlighter
    return highlighter
  })

  return highlighterPromise
}
