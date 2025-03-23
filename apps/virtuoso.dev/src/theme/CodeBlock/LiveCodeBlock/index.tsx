import createCache from '@emotion/cache';
import * as MUIStyles from '@mui/material/styles';
import { Box, Callout, Flex, IconButton, Tooltip } from '@radix-ui/themes';
import { Uri } from 'monaco-editor';
import React, { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import MonacoEditor, { MonacoEditorHandle } from '@virtuoso.dev/react-monaco-editor';

import { useColorMode } from '@docusaurus/theme-common';
import { CheckIcon, ClipboardCopyIcon, CubeIcon, ReloadIcon, ResetIcon } from '@radix-ui/react-icons';
import { transformToFunctionBody } from './esmTransform';
import iFrameStyle from '!!raw-loader!./iframe-style.css';


import { createSandbox } from './createCodesandbox';

import copy from 'copy-text-to-clipboard';

import ErrorBoundary from '@docusaurus/ErrorBoundary';

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { CacheProvider } from '@emotion/react';
import { importMap, libDefinitions } from './extraImports';

monaco?.editor.defineTheme('custom-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#00000000',
  }
});

monaco?.editor.defineTheme('custom-light', {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#ffffff00',
  }
});

monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
  jsxFactory: 'React.createElement',
  jsxFragmentFactory: 'React.Fragment',
  reactNamespace: 'React',
  allowNonTsExtensions: true,
  allowSyntheticDefaultImports: true,
  target: monaco.languages.typescript.ScriptTarget.Latest,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  typeRoots: ['node_modules/@types'],
})

monaco.languages.typescript.typescriptDefaults.setExtraLibs(libDefinitions)


export default function LiveCodeBlock({
  code,
  disableSandbox = false
}: { code: string, disableSandbox?: boolean }): ReactNode {
  const [tsCode, setTsCode] = React.useState(code)
  const [Comp, setComp] = React.useState<React.ComponentType | null>(null)
  const [usedPackages, setUsedPackages] = React.useState<string[]>([])
  const { colorMode } = useColorMode();
  const [codeWrapperHeight, setCodeWrapperHeight] = React.useState<number>(200)
  const updateCodeRef = React.useRef<(code: string) => void | null>(null)
  const [CopyButtonIcon, setCopyButtonIcon] = React.useState<React.ComponentType<{ width: any, height: any }>>(ClipboardCopyIcon)
  const randomTypeScriptFileName = React.useMemo(() => {
    return `file:///custom-example-${Math.random().toString(36).substring(7)}.tsx`
  }, [])
  const monacoEditorRef = useRef<MonacoEditorHandle>(null)


  useEffect(() => {
    transformToFunctionBody(tsCode).then((result) => {
      if (result.type === 'success') {
        try {
          const NewComp = (new Function(result.code))(importMap)
          setComp(() => NewComp)
          setUsedPackages(result.packages)
        } catch (e) {
          console.log('code is invalid:', e)
        }
      }
    })
  }, [tsCode])


  return (
    <Flex direction="column" style={{ position: 'relative', marginBottom: '1rem', maxHeight: '600px' }}>
      <Flex direction="row" className='live-code-block-wrapper' height={`${codeWrapperHeight + 20}px`} >
        <Box flexGrow="0" width="50%" className='live-code-block'>
          <MonacoEditor
            ref={monacoEditorRef}
            value={code}
            options={{
              automaticLayout: true,
              minimap: { enabled: false },
              lineNumbers: "off",
              lineNumbersMinChars: 0,
              folding: false,
              glyphMargin: false,
              overviewRulerBorder: false,
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              renderLineHighlight: 'none',
              lineDecorationsWidth: 10,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              wrappingStrategy: 'advanced',
              stickyScroll: {
                enabled: false
              }
            }}
            width="100%"
            height="100%"
            language="typescript"
            theme={colorMode === 'dark' ? 'custom-dark' : 'custom-light'}
            uri={() => Uri.parse(randomTypeScriptFileName)}
            onChange={(value) => {
              setTsCode(value)
            }}
            editorDidMount={(editor) => {
              const updateHeight = () => {
                setCodeWrapperHeight(editor.getContentHeight() + 30);
              };
              editor.onDidContentSizeChange(updateHeight);
              updateHeight();
            }}
          />
        </Box>
        <Box flexGrow="0" width="50%" className='live-code-block-preview'>
          <ErrorBoundary fallback={({ error, tryAgain }) => {
            return <ErrorMessage message={error.message} retry={tryAgain} />
          }}>
            <IframePortal>
              {Comp && <Comp />}
            </IframePortal>
          </ErrorBoundary>
        </Box>
      </Flex>
      <Flex direction="row" gap="1" style={{ position: 'absolute', right: '50%', bottom: 0 }} p="2">
        <Tooltip content="Reset example">
          <IconButton size="1" radius='large' variant='soft' onClick={() => {
            setTsCode(code)
            monacoEditorRef.current?.editor.setValue(code)
          }}>
            <ResetIcon width={14} height={14} />
          </IconButton>
        </Tooltip>

        <Tooltip content='Copy code'>
          <IconButton size="1" radius='large' variant='soft' onClick={() => {
            copy(tsCode)
            setCopyButtonIcon(CheckIcon)
            setTimeout(() => {
              setCopyButtonIcon(ClipboardCopyIcon)
            }, 1000)
          }}>
            <CopyButtonIcon width={14} height={14} />
          </IconButton>
        </Tooltip>

        {!disableSandbox &&
          <Tooltip content="Open in codesandbox.io">
            <IconButton size="1" radius='large' variant='soft' onClick={() => {
              createSandbox(tsCode, usedPackages)
            }}>
              <CubeIcon width={14} height={14} />
            </IconButton>
          </Tooltip>
        }
      </Flex>
    </Flex>
  )
}

const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')

const IframePortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [iFrameEl, setIframeEl] = React.useState<HTMLIFrameElement | null>(null)
  const { colorMode } = useColorMode();

  const cache = createCache({
    key: 'css',
    container: iFrameEl?.contentWindow?.document?.head,
    prepend: true
  })

  return (
    <MUIStyles.StyledEngineProvider injectFirst>
      <iframe
        ref={(el) => {
          if (!isFirefox) {
            setIframeEl(el)
          }
        }}
        onLoad={(e) => {
          if (isFirefox) {
            setIframeEl(e.target as HTMLIFrameElement)
          }
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {iFrameEl ? createPortal(<CacheProvider value={cache}>
          <style>{iFrameStyle}</style>
          <style>{`
            :root {
              --foreground: ${colorMode === 'dark' ? '#fff' : '#000'};
              --background: ${colorMode === 'dark' ? '#000' : '#fff'};
              --border: ${colorMode === 'dark' ? '#333' : '#ccc'};
            }
          `}</style>
          {children}
        </CacheProvider>, iFrameEl.contentDocument!.body) : null}
      </iframe>
    </MUIStyles.StyledEngineProvider>
  )
}

/*
const ShadowDomPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const shadowContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [shadowRoot, setShadowRoot] = React.useState<ShadowRoot | null>(null);

  useEffect(() => {
    if (shadowContainerRef.current) {
      setShadowRoot(shadowContainerRef.current.attachShadow({ mode: 'open' }));
    }
  }, [])

  return (<div ref={shadowContainerRef} style={{ height: '100%' }}>
    {shadowRoot && createPortal(children, shadowRoot)}
  </div>);
}*/

const ErrorMessage: React.FC<{ message: string, retry: () => void }> = ({ message, retry }) => {
  return <Callout.Root variant='soft' color='ruby' size="1">
    <Callout.Icon>
      <Tooltip content="Retry">
        <IconButton variant='soft' onClick={retry} size="1">
          <ReloadIcon width={12} height={12} />
        </IconButton>
      </Tooltip>
    </Callout.Icon> <Callout.Text>
      {message}
    </Callout.Text>

  </Callout.Root>
}
