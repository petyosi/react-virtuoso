import React, { useEffect, useRef, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ErrorBoundary } from 'react-error-boundary'

import { CheckIcon, ClipboardCopyIcon, CubeIcon, ReloadIcon, ResetIcon } from '@radix-ui/react-icons'
import { shikiToMonaco } from '@shikijs/monaco'
import copy from 'copy-text-to-clipboard'

import { useStarlightTheme } from '@/components/theme-utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getShikiHighlighter } from '@/utils/shikiHighlighter'

import { bundleCode } from './bundleCode'
import { createSandbox } from './createCodesandbox'
import { importMap, libDefinitions } from './extraImports'
import iFrameStyle from './iframe-style.css?raw'
import { tailwindBrowserInlineScript } from './tailwindTransform'

import type { Theme } from '@/components/theme-utils'
import type * as MonacoEditor from 'monaco-editor'

interface FileEntry {
  code: string
  lang: string
}

let shikiInitialized = false
let eagerSyncEnabled = false

function configureMonacoWorkers() {
  if (typeof self === 'undefined') {
    return
  }

  self.MonacoEnvironment = {
    getWorker(_workerId: string, label: string) {
      if (label === 'typescript' || label === 'javascript') {
        return new Worker(new URL('monaco-editor/esm/vs/language/typescript/ts.worker.js', import.meta.url), { type: 'module' })
      }
      return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' })
    },
  }
}

function getCodeTypographyFromCSS(): {
  fontFamily: string
  fontSize: number
  lineHeight: number
} {
  if (typeof window === 'undefined') {
    return { fontFamily: 'monospace', fontSize: 14, lineHeight: 1.75 }
  }

  const computedStyle = getComputedStyle(document.documentElement)
  const fontFamily = computedStyle.getPropertyValue('--font-code-family').trim() || 'monospace'
  const fontSizeStr = computedStyle.getPropertyValue('--font-code-size').trim() || '14px'
  const lineHeightStr = computedStyle.getPropertyValue('--font-code-line-height').trim() || '1.75'

  let fontSize = 14
  if (fontSizeStr.includes('rem')) {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
    fontSize = parseFloat(fontSizeStr) * rootFontSize
  } else {
    fontSize = parseFloat(fontSizeStr)
  }

  return { fontFamily, fontSize, lineHeight: parseFloat(lineHeightStr) }
}

const shadcnVarsLight = `
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
`

const shadcnVarsDark = `
  --radius: 0.625rem;
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
`

const iframeThemeStyles = {
  dark: `
    :root {
      --foreground: #fff;
      --background: #000;
      --alt-background: #222222;
      --highlight: #B8860B;
      ${shadcnVarsDark}
    }
  `,
  light: `
    :root {
      --foreground: #1a1a1a;
      --background: #fff;
      --alt-background: #f5f5f5;
      --highlight: #B8860B;
      ${shadcnVarsLight}
    }
  `,
}

const iframeSource = '<!doctype html><html><head></head><body></body></html>'

const IframePortal: React.FC<{ children: React.ReactNode; theme: Theme }> = ({ children, theme }) => {
  const [iFrameEl, setIframeEl] = React.useState<HTMLIFrameElement | null>(null)
  const [portalRoot, setPortalRoot] = React.useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!iFrameEl) {
      setPortalRoot(null)
      return
    }

    const updatePortalRoot = () => {
      const doc = iFrameEl.contentDocument
      if (!doc) {
        setPortalRoot(null)
        return
      }
      if (!doc.head.querySelector('script[data-tailwind-inline]')) {
        const themeStyle = doc.createElement('style')
        themeStyle.setAttribute('type', 'text/tailwindcss')
        themeStyle.textContent = `
          @theme inline {
            --radius-sm: calc(var(--radius) - 4px);
            --radius-md: calc(var(--radius) - 2px);
            --radius-lg: var(--radius);
            --radius-xl: calc(var(--radius) + 4px);
            --color-background: var(--background);
            --color-foreground: var(--foreground);
            --color-card: var(--card);
            --color-card-foreground: var(--card-foreground);
            --color-popover: var(--popover);
            --color-popover-foreground: var(--popover-foreground);
            --color-primary: var(--primary);
            --color-primary-foreground: var(--primary-foreground);
            --color-secondary: var(--secondary);
            --color-secondary-foreground: var(--secondary-foreground);
            --color-muted: var(--muted);
            --color-muted-foreground: var(--muted-foreground);
            --color-accent: var(--accent);
            --color-accent-foreground: var(--accent-foreground);
            --color-destructive: var(--destructive);
            --color-border: var(--border);
            --color-input: var(--input);
            --color-ring: var(--ring);
          }
        `
        doc.head.append(themeStyle)

        const script = doc.createElement('script')
        script.setAttribute('data-tailwind-inline', 'true')
        script.textContent = tailwindBrowserInlineScript
        doc.head.append(script)
      }
      setPortalRoot(doc.body)
    }

    updatePortalRoot()
    iFrameEl.addEventListener('load', updatePortalRoot)

    return () => {
      iFrameEl.removeEventListener('load', updatePortalRoot)
    }
  }, [iFrameEl])

  return (
    <iframe ref={setIframeEl} srcDoc={iframeSource} style={{ height: '100%', width: '100%' }} title="Live code preview">
      {portalRoot
        ? createPortal(
            <>
              <style>{iFrameStyle}</style>
              <style>{iframeThemeStyles[theme]}</style>
              {children}
            </>,
            portalRoot
          )
        : null}
    </iframe>
  )
}

const ErrorMessage: React.FC<{ message: string; retry: () => void }> = ({ message, retry }) => {
  return (
    <div
      className={`
        flex items-center gap-2 rounded border border-red-500/30 bg-red-500/10
        p-2 text-sm
      `}
    >
      <button
        className={`
          rounded bg-red-500/20 p-1 transition-colors
          hover:bg-red-500/30
        `}
        onClick={retry}
      >
        <ReloadIcon height={12} width={12} />
      </button>
      <span className="text-red-400">{message}</span>
    </div>
  )
}

async function initializeMonacoWithShiki(m: typeof MonacoEditor) {
  if (shikiInitialized) {
    return
  }

  try {
    const highlighter = await getShikiHighlighter()

    m.languages.register({ id: 'typescript' })
    m.languages.register({ id: 'javascript' })
    m.languages.register({ id: 'tsx' })
    m.languages.register({ id: 'jsx' })
    m.languages.register({ id: 'json' })
    m.languages.register({ id: 'bash' })

    shikiToMonaco(highlighter, m)

    m.typescript.typescriptDefaults.setCompilerOptions({
      allowNonTsExtensions: true,
      allowSyntheticDefaultImports: true,
      baseUrl: 'file:///',
      jsx: m.typescript.JsxEmit.ReactJSX,
      jsxFactory: 'React.createElement',
      jsxFragmentFactory: 'React.Fragment',
      moduleResolution: m.typescript.ModuleResolutionKind.NodeJs,
      paths: {
        '@/*': ['src/*'],
      },
      reactNamespace: 'React',
      target: m.typescript.ScriptTarget.Latest,
      typeRoots: ['node_modules/@types'],
    })

    m.typescript.typescriptDefaults.setExtraLibs(libDefinitions)

    shikiInitialized = true
  } catch (error) {
    console.error('Failed to initialize Monaco with Shiki:', error)
    throw error
  }
}

function enableEagerModelSync(m: typeof MonacoEditor) {
  if (eagerSyncEnabled) {
    return
  }
  m.typescript.typescriptDefaults.setEagerModelSync(true)
  eagerSyncEnabled = true
}

function langToMonacoLanguage(lang: string): string {
  const map: Record<string, string> = { js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript' }
  return map[lang] ?? 'typescript'
}

export default function LiveCodeBlock({
  activeFile: activeFileProp,
  code,
  disableSandbox = false,
  files: filesProp,
  wide,
}: {
  activeFile?: string
  code?: string
  disableSandbox?: boolean
  files?: string
  wide?: string
}): ReactNode {
  const isWide = wide === 'true'
  const theme = useStarlightTheme()

  // Normalize props into a consistent shape
  const { entryPoint, isMultiFile, originalFiles } = React.useMemo(() => {
    if (filesProp !== undefined && filesProp !== '') {
      // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion)
      const parsed = JSON.parse(filesProp) as Record<string, FileEntry>
      const fileNames = Object.keys(parsed)
      const entryFile = activeFileProp ?? fileNames[0]!
      const codeMap: Record<string, string> = {}
      for (const [name, fileEntry] of Object.entries(parsed)) {
        codeMap[name] = fileEntry.code
      }
      return {
        entryPoint: entryFile,
        isMultiFile: fileNames.length > 1,
        originalFiles: codeMap,
      }
    }
    return {
      entryPoint: 'App.tsx',
      isMultiFile: false,
      originalFiles: { 'App.tsx': code ?? '' },
    }
  }, [filesProp, activeFileProp, code])

  const fileNames = React.useMemo(() => Object.keys(originalFiles), [originalFiles])

  const [filesMap, setFilesMap] = useState<Record<string, string>>(originalFiles)
  const [activeFileName, setActiveFileName] = useState(entryPoint)
  const [Comp, setComp] = useState<null | React.ComponentType>(null)
  const [usedPackages, setUsedPackages] = useState<string[]>([])
  const [codeWrapperHeight, setCodeWrapperHeight] = useState<number>(200)
  const [CopyButtonIcon, setCopyButtonIcon] = useState<React.ComponentType<ComponentProps<typeof ClipboardCopyIcon>>>(ClipboardCopyIcon)
  const [errorKey, setErrorKey] = useState(0)
  const [monacoReady, setMonacoReady] = useState(false)

  const instanceId = React.useMemo(() => Math.random().toString(36).substring(7), [])
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<null | typeof MonacoEditor>(null)
  const modelsRef = useRef<Map<string, MonacoEditor.editor.ITextModel>>(new Map())
  const viewStatesRef = useRef<Map<string, MonacoEditor.editor.ICodeEditorViewState>>(new Map())

  useEffect(() => {
    const loadMonaco = async () => {
      try {
        configureMonacoWorkers()
        const monacoModule = await import('monaco-editor')
        monacoRef.current = monacoModule
        await initializeMonacoWithShiki(monacoModule)
        if (isMultiFile) {
          enableEagerModelSync(monacoModule)
        }
        setMonacoReady(true)
      } catch (error) {
        console.error('Monaco initialization failed:', error)
      }
    }
    void loadMonaco()
  }, [isMultiFile])

  // Create editor and models
  useEffect(() => {
    const monaco = monacoRef.current
    if (!monacoReady || !monaco || !editorContainerRef.current || editorRef.current) {
      return
    }

    const typography = getCodeTypographyFromCSS()

    const editor = monaco.editor.create(editorContainerRef.current, {
      automaticLayout: true,
      folding: false,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      glyphMargin: false,
      hideCursorInOverviewRuler: true,
      language: 'typescript',
      lineDecorationsWidth: 10,
      lineHeight: typography.lineHeight,
      lineNumbers: 'off',
      lineNumbersMinChars: 0,
      minimap: { enabled: false },
      overviewRulerBorder: false,
      overviewRulerLanes: 0,
      renderLineHighlight: 'none',
      scrollBeyondLastLine: false,
      stickyScroll: { enabled: false },
      theme: theme === 'light' ? 'github-light' : 'github-dark',
      wordWrap: 'on',
      wrappingStrategy: 'advanced',
    })

    editorRef.current = editor

    // Create models for all files
    const models = new Map<string, MonacoEditor.editor.ITextModel>()
    for (const [fileName, fileCode] of Object.entries(originalFiles)) {
      const uri = monaco.Uri.parse(`file:///instance-${instanceId}/${fileName}`)
      const existing = monaco.editor.getModel(uri)
      const lang = langToMonacoLanguage(fileName.split('.').pop() ?? 'tsx')
      const model = existing ?? monaco.editor.createModel(fileCode, lang, uri)
      models.set(fileName, model)
    }
    modelsRef.current = models

    // Set the active model
    const activeModel = models.get(entryPoint)!
    editor.setModel(activeModel)

    editor.onDidChangeModelContent(() => {
      const currentModel = editor.getModel()
      if (!currentModel) {
        return
      }
      const currentFileName = [...models.entries()].find(([, model]) => model === currentModel)?.[0]
      if (currentFileName !== undefined && currentFileName !== '') {
        setFilesMap((prev) => ({ ...prev, [currentFileName]: currentModel.getValue() }))
      }
    })

    const tabBarHeight = isMultiFile ? 28 : 0
    const updateHeight = () => {
      setCodeWrapperHeight(editor.getContentHeight() + 30 + tabBarHeight)
    }
    editor.onDidContentSizeChange(updateHeight)
    updateHeight()

    return () => {
      for (const model of models.values()) {
        model.dispose()
      }
      editor.dispose()
      editorRef.current = null
      modelsRef.current = new Map()
      viewStatesRef.current = new Map()
    }
    // oxlint-disable-next-line exhaustive-deps
  }, [monacoReady, originalFiles, instanceId, entryPoint])

  // Update Monaco theme when Starlight theme changes
  useEffect(() => {
    const m = monacoRef.current
    if (editorRef.current && m) {
      m.editor.setTheme(theme === 'light' ? 'github-light' : 'github-dark')
    }
  }, [theme])

  // Bundle whenever files change
  useEffect(() => {
    bundleCode(filesMap, entryPoint)
      .then((result) => {
        if (result.type === 'success') {
          try {
            // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion)
            const NewComp = new Function(result.code)(importMap) as React.FC
            setComp(() => NewComp)
            setUsedPackages(result.packages)
            setErrorKey((k) => k + 1)
          } catch (e) {
            console.log('code is invalid:', e, result.code)
          }
        }
        return undefined
      })
      .catch((e: unknown) => {
        console.log('code is invalid:', e)
      })
  }, [filesMap, entryPoint])

  const switchToFile = (fileName: string) => {
    const editor = editorRef.current
    if (!editor) {
      return
    }

    // Save current view state
    const currentState = editor.saveViewState()
    if (currentState) {
      viewStatesRef.current.set(activeFileName, currentState)
    }

    // Switch model
    const targetModel = modelsRef.current.get(fileName)
    if (targetModel) {
      editor.setModel(targetModel)
      const savedState = viewStatesRef.current.get(fileName)
      if (savedState) {
        editor.restoreViewState(savedState)
      }
      setActiveFileName(fileName)

      // Update height for new file (28px tab bar offset for multi-file)
      setCodeWrapperHeight(editor.getContentHeight() + 30 + 28)
    }
  }

  const handleReset = () => {
    setFilesMap(originalFiles)
    for (const [fileName, fileCode] of Object.entries(originalFiles)) {
      const model = modelsRef.current.get(fileName)
      if (model) {
        model.setValue(fileCode)
      }
    }
    viewStatesRef.current = new Map()
  }

  const handleCopy = () => {
    copy(filesMap[activeFileName] ?? '')
    setCopyButtonIcon(CheckIcon)
    setTimeout(() => {
      setCopyButtonIcon(ClipboardCopyIcon)
    }, 1000)
  }

  return (
    <div className="not-content relative">
      <div
        className={`
          live-code-block-wrapper relative flex rounded border border-border-secondary
          ${isWide ? 'flex-col divide-y' : 'max-h-[600px] flex-row divide-x'}
        `}
        style={isWide ? undefined : { height: `${codeWrapperHeight + 20}px` }}
      >
        <div
          className={`
            live-code-block flex shrink-0 flex-col bg-surface-codeblock px-1 py-2
            ${isWide ? 'h-[300px] w-full overflow-auto rounded-t' : 'w-1/2 rounded-s'}
          `}
        >
          {isMultiFile && (
            <div className="flex shrink-0 flex-row gap-0 border-b border-border-secondary px-1 pb-1">
              {fileNames.map((fileName) => (
                <button
                  className={`
                    rounded-t px-2 py-0.5 text-xs transition-colors
                    ${fileName === activeFileName ? 'bg-surface-codeblock-active text-foreground' : 'text-muted-foreground hover:text-foreground'}
                  `}
                  key={fileName}
                  onClick={() => {
                    switchToFile(fileName)
                  }}
                >
                  {fileName}
                </button>
              ))}
            </div>
          )}
          {monacoReady ? (
            <div ref={editorContainerRef} style={{ flex: 1, minHeight: 0, width: '100%' }} />
          ) : (
            <pre
              className={`
                sr-only m-0 overflow-auto bg-(--sl-color-gray-6) p-4 text-sm
              `}
            >
              <code>{code ?? Object.values(originalFiles)[0]}</code>
            </pre>
          )}
        </div>
        <div className={`shrink-0 p-1 ${isWide ? 'h-[400px] w-full' : 'w-1/2'}`}>
          <ErrorBoundary
            fallbackRender={({ error, resetErrorBoundary }) => (
              <ErrorMessage message={error instanceof Error ? error.message : String(error)} retry={resetErrorBoundary} />
            )}
            key={errorKey}
          >
            <IframePortal theme={theme}>{Comp && <Comp />}</IframePortal>
          </ErrorBoundary>
        </div>
      </div>

      <div
        className={`
          absolute bottom-0 z-10 flex flex-row rounded-tl border-t border-l
          border-border-secondary bg-surface-codeblock p-1
          ${isWide ? 'right-0' : 'right-1/2'}
        `}
      >
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="cursor-pointer" onClick={handleReset} size="radixIcon" variant="ghost">
                <ResetIcon className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset code</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="cursor-pointer" onClick={handleCopy} size="radixIcon" variant="ghost">
                <CopyButtonIcon className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy code</p>
            </TooltipContent>
          </Tooltip>

          {!disableSandbox && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="cursor-pointer"
                  onClick={() => {
                    void createSandbox(filesMap, usedPackages)
                  }}
                  size="radixIcon"
                  variant="ghost"
                >
                  <CubeIcon className="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open in CodeSandbox</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
    </div>
  )
}
