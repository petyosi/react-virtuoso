/* eslint-disable no-console */
import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ErrorBoundary } from "react-error-boundary";

import {
  CheckIcon,
  ClipboardCopyIcon,
  CubeIcon,
  ReloadIcon,
  ResetIcon,
} from "@radix-ui/react-icons";
import { transformToFunctionBody } from "./esmTransform";
// @ts-ignore - Vite raw import
import iFrameStyle from "./iframe-style.css?raw";

import { createSandbox } from "./createCodesandbox";

import copy from "copy-text-to-clipboard";

import { importMap, libDefinitions } from "./extraImports";

// Monaco will be dynamically imported on client side only
let monaco: typeof import("monaco-editor") | null = null;

// Configure Monaco workers for Vite
function configureMonacoWorkers() {
  if (typeof self === "undefined") return;

  // @ts-ignore
  self.MonacoEnvironment = {
    getWorker: function (_workerId: string, label: string) {
      if (label === "typescript" || label === "javascript") {
        return new Worker(
          new URL(
            "monaco-editor/esm/vs/language/typescript/ts.worker.js",
            import.meta.url,
          ),
          { type: "module" },
        );
      }
      return new Worker(
        new URL(
          "monaco-editor/esm/vs/editor/editor.worker.js",
          import.meta.url,
        ),
        { type: "module" },
      );
    },
  };
}

const isFirefox =
  typeof navigator !== "undefined" &&
  navigator.userAgent.toLowerCase().includes("firefox");

type Theme = "light" | "dark";

function getStarlightTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function useStarlightTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(getStarlightTheme);

  useEffect(() => {
    // Update theme when it changes
    const observer = new MutationObserver(() => {
      setTheme(getStarlightTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    // Set initial theme (in case SSR mismatched)
    setTheme(getStarlightTheme());

    return () => observer.disconnect();
  }, []);

  return theme;
}

const iframeThemeStyles = {
  dark: `
    :root {
      --foreground: #fff;
      --background: #000;
      --alt-background: #222222;
      --border: #333;
      --highlight: #B8860B;
    }
  `,
  light: `
    :root {
      --foreground: #1a1a1a;
      --background: #fff;
      --alt-background: #f5f5f5;
      --border: #e0e0e0;
      --highlight: #B8860B;
    }
  `,
};

const IframePortal: React.FC<{ children: React.ReactNode; theme: Theme }> = ({
  children,
  theme,
}) => {
  const [iFrameEl, setIframeEl] = React.useState<HTMLIFrameElement | null>(
    null,
  );

  return (
    <iframe
      ref={(el) => {
        if (!isFirefox) {
          setIframeEl(el);
        }
      }}
      onLoad={(e) => {
        if (isFirefox) {
          setIframeEl(e.target as HTMLIFrameElement);
        }
      }}
      style={{ width: "100%", height: "100%" }}
    >
      {iFrameEl?.contentDocument
        ? createPortal(
            <>
              <style>{iFrameStyle}</style>
              <style>{iframeThemeStyles[theme]}</style>
              {children}
            </>,
            iFrameEl.contentDocument.body,
          )
        : null}
    </iframe>
  );
};

const ErrorMessage: React.FC<{ message: string; retry: () => void }> = ({
  message,
  retry,
}) => {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded p-2 flex items-center gap-2 text-sm">
      <button
        className="p-1 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors"
        onClick={retry}
      >
        <ReloadIcon width={12} height={12} />
      </button>
      <span className="text-red-400">{message}</span>
    </div>
  );
};

// Define themes once Monaco is available
let themesInitialized = false;
function initializeMonacoThemes(m: typeof import("monaco-editor")) {
  if (themesInitialized) return;
  themesInitialized = true;

  m.editor.defineTheme("custom-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#00000000",
    },
  });

  m.editor.defineTheme("custom-light", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#00000000",
    },
  });

  // Configure TypeScript compiler options
  m.typescript.typescriptDefaults.setCompilerOptions({
    jsx: m.typescript.JsxEmit.ReactJSX,
    jsxFactory: "React.createElement",
    jsxFragmentFactory: "React.Fragment",
    reactNamespace: "React",
    allowNonTsExtensions: true,
    allowSyntheticDefaultImports: true,
    target: m.typescript.ScriptTarget.Latest,
    moduleResolution: m.typescript.ModuleResolutionKind.NodeJs,
    typeRoots: ["node_modules/@types"],
  });

  m.typescript.typescriptDefaults.setExtraLibs(libDefinitions);
}

export default function LiveCodeBlock({
  code,
  disableSandbox = false,
}: {
  code: string;
  disableSandbox?: boolean;
}): ReactNode {
  const theme = useStarlightTheme();
  const [tsCode, setTsCode] = useState(code);
  const [Comp, setComp] = useState<React.ComponentType | null>(null);
  const [usedPackages, setUsedPackages] = useState<string[]>([]);
  const [codeWrapperHeight, setCodeWrapperHeight] = useState<number>(200);
  const [CopyButtonIcon, setCopyButtonIcon] =
    useState<React.ComponentType<{ width: number; height: number }>>(
      ClipboardCopyIcon,
    );
  const randomTypeScriptFileName = React.useMemo(() => {
    return `file:///custom-example-${Math.random().toString(36).substring(7)}.tsx`;
  }, []);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<
    import("monaco-editor").editor.IStandaloneCodeEditor | null
  >(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  const [monacoReady, setMonacoReady] = useState(false);

  // Dynamically import and initialize Monaco
  useEffect(() => {
    const loadMonaco = async () => {
      configureMonacoWorkers();
      const m = await import("monaco-editor");
      monaco = m;
      monacoRef.current = m;
      initializeMonacoThemes(m);
      setMonacoReady(true);
    };
    loadMonaco();
  }, []);

  // Create the Monaco editor
  useEffect(() => {
    const m = monacoRef.current;
    if (!monacoReady || !m || !editorContainerRef.current || editorRef.current)
      return;

    const editor = m.editor.create(editorContainerRef.current, {
      value: code,
      language: "typescript",
      theme: theme === "light" ? "custom-light" : "custom-dark",
      automaticLayout: true,
      minimap: { enabled: false },
      lineNumbers: "off",
      lineNumbersMinChars: 0,
      folding: false,
      glyphMargin: false,
      overviewRulerBorder: false,
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      renderLineHighlight: "none",
      lineDecorationsWidth: 10,
      scrollBeyondLastLine: false,
      wordWrap: "on",
      wrappingStrategy: "advanced",
      stickyScroll: {
        enabled: false,
      },
    });

    // Create a model with the custom file path for proper TypeScript support
    const model = m.editor.createModel(
      code,
      "typescript",
      m.Uri.parse(randomTypeScriptFileName),
    );
    editor.setModel(model);

    editorRef.current = editor;

    // Handle code changes
    editor.onDidChangeModelContent(() => {
      setTsCode(editor.getValue());
    });

    const updateHeight = () => {
      setCodeWrapperHeight(editor.getContentHeight() + 30);
    };

    editor.onDidContentSizeChange(updateHeight);
    updateHeight();

    return () => {
      model.dispose();
      editor.dispose();
      editorRef.current = null;
    };
  }, [monacoReady, code, randomTypeScriptFileName]);

  // Update Monaco theme when Starlight theme changes
  useEffect(() => {
    const m = monacoRef.current;
    if (editorRef.current && m) {
      const editorTheme = theme === "light" ? "custom-light" : "custom-dark";
      m.editor.setTheme(editorTheme);
    }
  }, [theme]);

  useEffect(() => {
    transformToFunctionBody(tsCode)
      .then((result) => {
        if (result.type === "success") {
          try {
            // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-call
            const NewComp = new Function(result.code ?? "")(
              importMap,
            ) as React.FC;
            setComp(() => NewComp);
            setUsedPackages(result.packages ?? []);
            setErrorKey((k) => k + 1);
          } catch (e) {
            console.log("code is invalid:", e, result.code);
          }
        }
      })
      .catch((e: unknown) => {
        console.log("code is invalid:", e);
      });
  }, [tsCode]);

  return (
    <div className="not-content relative max-h-[600px] flex flex-col">
      <div
        className="live-code-block-wrapper flex flex-row"
        style={{ height: `${codeWrapperHeight + 20}px` }}
      >
        <div className="live-code-block w-1/2 shrink-0">
          {monacoReady ? (
            <div
              ref={editorContainerRef}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <pre className="p-4 m-0 overflow-auto text-sm bg-(--sl-color-gray-6)">
              <code>{code}</code>
            </pre>
          )}
        </div>
        <div className="live-code-block-preview w-1/2 shrink-0">
          <ErrorBoundary
            key={errorKey}
            fallbackRender={({ error, resetErrorBoundary }) => (
              <ErrorMessage
                message={error.message}
                retry={resetErrorBoundary}
              />
            )}
          >
            <IframePortal theme={theme}>{Comp && <Comp />}</IframePortal>
          </ErrorBoundary>
        </div>
      </div>
      <div className="absolute right-1/2 bottom-0 p-2 flex flex-row gap-1">
        <button
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          onClick={() => {
            setTsCode(code);
            editorRef.current?.setValue(code);
          }}
        >
          <ResetIcon width={14} height={14} />
        </button>

        <button
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          onClick={() => {
            copy(tsCode);
            setCopyButtonIcon(CheckIcon);
            setTimeout(() => {
              setCopyButtonIcon(ClipboardCopyIcon);
            }, 1000);
          }}
        >
          <CopyButtonIcon width={14} height={14} />
        </button>

        {!disableSandbox && (
          <button
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => {
              void createSandbox(tsCode, usedPackages);
            }}
          >
            <CubeIcon width={14} height={14} />
          </button>
        )}
      </div>
    </div>
  );
}
