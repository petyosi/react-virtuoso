import { useEffect, useMemo, useState } from 'react'
import type { ComponentProps } from 'react'

import { CheckIcon, ClipboardCopyIcon } from '@radix-ui/react-icons'
import copy from 'copy-text-to-clipboard'

import { useStarlightTheme } from '@/components/theme-utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getShikiHighlighter } from '@/utils/shikiHighlighter'

import type { HighlighterCore } from 'shiki/core'

interface StaticCodeBlockProps {
  code: string
  lang: string
  meta?: string
}

const actionButtonClassName = `
  cursor-pointer bg-background text-foreground shadow-sm ring-1 ring-border/80
  hover:bg-accent hover:text-accent-foreground
`

function normalizeLanguage(lang: string) {
  if (lang === 'ts') {
    return 'typescript'
  }
  if (lang === 'js') {
    return 'javascript'
  }
  if (lang === 'sh' || lang === 'shell') {
    return 'bash'
  }
  return lang
}

function withStaticCodeBlockClass(html: string) {
  if (html.includes('<pre class="')) {
    return html.replace('<pre class="', '<pre class="static-code-block ')
  }
  return html.replace('<pre', '<pre class="static-code-block"')
}

export default function StaticCodeBlock({ code, lang }: StaticCodeBlockProps) {
  const theme = useStarlightTheme()
  const [CopyButtonIcon, setCopyButtonIcon] = useState<React.ComponentType<ComponentProps<typeof ClipboardCopyIcon>>>(ClipboardCopyIcon)
  const [highlighter, setHighlighter] = useState<HighlighterCore | null>(null)

  useEffect(() => {
    void getShikiHighlighter().then(setHighlighter)
  }, [])

  const shikiTheme = theme === 'light' ? 'github-light' : 'github-dark'
  const highlightedHtml = useMemo(() => {
    if (highlighter === null || lang === 'text') {
      return null
    }

    try {
      return withStaticCodeBlockClass(
        highlighter.codeToHtml(code, {
          lang: normalizeLanguage(lang),
          theme: shikiTheme,
        })
      )
    } catch {
      return null
    }
  }, [code, highlighter, lang, shikiTheme])

  return (
    <div
      className={`
        not-content relative rounded border border-border-secondary
        bg-surface-codeblock
      `}
    >
      {highlightedHtml === null ? (
        <pre className="static-code-block">
          <code>{code}</code>
        </pre>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      )}

      <div className="absolute right-1 bottom-1">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className={actionButtonClassName}
                onClick={() => {
                  copy(code)
                  setCopyButtonIcon(CheckIcon)
                  setTimeout(() => {
                    setCopyButtonIcon(ClipboardCopyIcon)
                  }, 1000)
                }}
                size="radixIcon"
                variant="ghost"
              >
                <CopyButtonIcon className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy code</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
