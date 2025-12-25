import { CheckIcon, ClipboardCopyIcon } from '@radix-ui/react-icons'
import copy from 'copy-text-to-clipboard'
import { type ComponentProps, useState } from 'react'
import ShikiHighlighter from 'react-shiki/web'

import { useStarlightTheme } from '@/components/theme-utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface StaticCodeBlockProps {
  code: string
  lang: string
  meta?: string
}

export default function StaticCodeBlock({ code, lang }: StaticCodeBlockProps) {
  const theme = useStarlightTheme()
  const [CopyButtonIcon, setCopyButtonIcon] = useState<React.ComponentType<ComponentProps<typeof ClipboardCopyIcon>>>(ClipboardCopyIcon)

  const shikiTheme = theme === 'light' ? 'github-light' : 'github-dark'

  return (
    <div
      className={`
        not-content relative rounded border border-border-secondary
        bg-surface-codeblock
      `}
    >
      <ShikiHighlighter addDefaultStyles={false} className="static-code-block" langStyle={{}} language={lang} theme={shikiTheme}>
        {code}
      </ShikiHighlighter>

      <div className="absolute right-1 bottom-1">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="cursor-pointer"
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
