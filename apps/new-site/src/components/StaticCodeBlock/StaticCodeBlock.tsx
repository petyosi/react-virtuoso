import { useState, type ComponentProps } from "react";
import ShikiHighlighter from "react-shiki/web";
import copy from "copy-text-to-clipboard";
import { CheckIcon, ClipboardCopyIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStarlightTheme } from "@/components/theme-utils";

interface StaticCodeBlockProps {
  code: string;
  lang: string;
  meta?: string;
}

export default function StaticCodeBlock({ code, lang }: StaticCodeBlockProps) {
  const theme = useStarlightTheme();
  const [CopyButtonIcon, setCopyButtonIcon] =
    useState<React.ComponentType<ComponentProps<typeof ClipboardCopyIcon>>>(
      ClipboardCopyIcon,
    );

  const shikiTheme = theme === "light" ? "github-light" : "github-dark";

  return (
    <div className="relative not-content border border-border-secondary rounded bg-surface-codeblock">
      <ShikiHighlighter
        language={lang}
        theme={shikiTheme}
        className="static-code-block"
        langStyle={{}}
        addDefaultStyles={false}
      >
        {code}
      </ShikiHighlighter>

      <div className="absolute bottom-1 right-1">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="cursor-pointer"
                variant="ghost"
                size="radixIcon"
                onClick={() => {
                  copy(code);
                  setCopyButtonIcon(CheckIcon);
                  setTimeout(() => {
                    setCopyButtonIcon(ClipboardCopyIcon);
                  }, 1000);
                }}
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
  );
}
