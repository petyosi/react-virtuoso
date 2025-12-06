import { createHighlighter, type Highlighter } from 'shiki'

let highlighterInstance: Highlighter | null = null
let highlighterPromise: Promise<Highlighter> | null = null

export async function getShikiHighlighter(): Promise<Highlighter> {
  if (highlighterInstance) {
    return highlighterInstance
  }

  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: ['typescript', 'javascript', 'tsx', 'jsx', 'json', 'bash']
    }).then(highlighter => {
      highlighterInstance = highlighter
      return highlighter
    })
  }

  return highlighterPromise
}
