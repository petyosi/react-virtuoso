import { Box, Flex, IconButton, Tooltip } from '@radix-ui/themes';
import { Uri } from 'monaco-editor';
import React, { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import MonacoEditor from 'react-monaco-editor';
import * as _V from 'react-virtuoso';

import { useColorMode } from '@docusaurus/theme-common';
import { ClipboardCopyIcon, CubeIcon, ResetIcon } from '@radix-ui/react-icons';
import { transformToFunctionBody } from './esmTransform';

// @ts-ignore
import reactVirtuosoDtsCode from '!!raw-loader!../../../../../../node_modules/react-virtuoso/dist/index.d.ts';
// @ts-ignore
import reactDtsCode from '!!raw-loader!../../../../../../node_modules/@types/react/index.d.ts';

// @ts-ignore
import jsxRuntimeDtsCode from '!!raw-loader!../../../../../../node_modules/@types/react/jsx-runtime.d.ts';
import { createSandbox } from './createCodesandbox';

// const reactVirtuosoDtsCode = ''
// const reactDtsCode = ''
export default function LiveCodeBlock({
  code
}: { code: string }): ReactNode {
  const [tsCode, setTsCode] = React.useState(code)
  const [Comp, setComp] = React.useState<React.ComponentType | null>(null)
  const { colorMode } = useColorMode();
  const [codeWrapperHeight, setCodeWrapperHeight] = React.useState<number>(200)
  const updateCodeRef = React.useRef<(code: string) => void | null>(null)
  const [copyTooltip, setCopyTooltip] = React.useState<string>('Copy code')
  const [forceOpenCopyTooltip, setForceopenCopyTooltip] = React.useState<true | undefined>(undefined)

  useEffect(() => {
    transformToFunctionBody(tsCode).then((result) => {
      if (result.type === 'success') {
        try {
          const NewComp = (new Function(result.code))({ 'react': React, 'react-virtuoso': _V })
          setComp(() => NewComp)
        } catch {
          console.log('code is invalid')
        }
      }
    })
  }, [tsCode])


  return (
    <Flex direction="column" style={{ position: 'relative' }}>
      <Flex direction="row" className='live-code-block-wrapper'>
        <Box flexGrow="0" width="50%" height={`${codeWrapperHeight}px`} className='live-code-block'>
          <MonacoEditor
            options={{
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
            }}
            value={tsCode}
            width="100%"
            height="100%"
            language="typescript"
            theme={colorMode === 'dark' ? 'custom-dark' : 'custom-light'}
            uri={() => Uri.parse('file:///custom-example.tsx')}
            onChange={(value) => {
              setTsCode(value)
            }}
            editorDidMount={(editor) => {
              let ignoreEvent = false;
              const updateHeight = () => {
                setCodeWrapperHeight(editor.getContentHeight() + 40);
                try {
                  ignoreEvent = true;
                  editor.layout();
                } finally {
                  ignoreEvent = false;
                }
              };
              editor.onDidContentSizeChange(updateHeight);
              updateCodeRef.current = (code) => {
                editor.setValue(code)
              }
              updateHeight();
            }}
            editorWillMount={(monaco) => {

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
                reactNamespace: 'React',
                allowNonTsExtensions: true,
                allowSyntheticDefaultImports: true,
                target: monaco.languages.typescript.ScriptTarget.Latest,
                moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                typeRoots: ['node_modules/@types'],
              })


              // react types
              monaco.languages.typescript.typescriptDefaults.addExtraLib(
                (reactDtsCode as any) as string,
                'file:///node_modules/@types/react/index.d.ts',
              )

              // jsx-runtime
              monaco.languages.typescript.typescriptDefaults.addExtraLib(
                (jsxRuntimeDtsCode as any) as string,
                'file:///node_modules/@types/react/jsx-runtime.d.ts',
              )

              monaco.languages.typescript.typescriptDefaults.addExtraLib(
                (reactVirtuosoDtsCode as any) as string,
                'file:///node_modules/@types/react-virtuoso/index.d.ts',
              )
            }}
          />
        </Box>
        <Box flexGrow="0" width="50%" className='live-code-block-preview'>
          <ShadowDomPortal>
            {Comp && <Comp />}
          </ShadowDomPortal>
        </Box>
      </Flex>
      <Flex direction="row" gap="1" style={{ position: 'absolute', right: '50%', bottom: 0 }} p="1">
        <Tooltip content="Reset example">
          <IconButton size="1" radius='large' variant='soft' onClick={() => {
            setTsCode(code)
            updateCodeRef.current?.(code)
          }}>
            <ResetIcon width={14} height={14} />
          </IconButton>
        </Tooltip>

        <Tooltip content={copyTooltip} open={forceOpenCopyTooltip}>
          <IconButton size="1" radius='large' variant='soft' onClick={() => {
            navigator.clipboard.writeText(tsCode)
            setCopyTooltip('Copied!')
            setForceopenCopyTooltip(true)
            setTimeout(() => {
              setCopyTooltip('Copy code')
              setForceopenCopyTooltip(undefined)
            }, 600)
          }}>
            <ClipboardCopyIcon width={14} height={14} />
          </IconButton>
        </Tooltip>

        <Tooltip content="Open in codesandbox.io">
          <IconButton size="1" radius='large' variant='soft' onClick={() => {
            createSandbox(tsCode)
          }}>
            <CubeIcon width={14} height={14} />
          </IconButton>
        </Tooltip>
      </Flex>
    </Flex>
  )
}

// const IframePortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const iframeRef = React.useRef<HTMLIFrameElement>(null);
//
//   return (<iframe ref={iframeRef}>
//     {iframeRef.current && createPortal(children, iframeRef.current.contentDocument.body)}
//   </iframe>);
// }

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
}
