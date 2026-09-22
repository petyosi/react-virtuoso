import * as React from 'react'

import { Engine } from '@virtuoso.dev/reactive-engine-core'

import { clearRegistryEngine, EngineContext, getRefInternal, setRegistryEngine, useIsomorphicLayoutEffect } from './hooks'

import type { EngineRef } from './hooks'
import type { DiagnosticObserver, DiagnosticObserverOptions } from '@virtuoso.dev/reactive-engine-core'

interface DiagnosticsBinding {
  config: DiagnosticsConfigSnapshot | undefined
  engine: Engine
  unsubscribe: (() => void) | undefined
}

interface DiagnosticsConfigSnapshot {
  captureValues: DiagnosticObserverOptions['captureValues']
  includeSuppressed: DiagnosticObserverOptions['includeSuppressed']
  observer: DiagnosticObserver
  onObserverError: DiagnosticObserverOptions['onObserverError']
  redact: DiagnosticObserverOptions['redact']
}

interface PendingEngineDispose {
  cancelled: boolean
  engine: Engine
  engineRef: EngineRef | undefined
  id: string | undefined
  initWith: Record<symbol, unknown> | undefined
}

function bindDiagnostics(engine: Engine, config: EngineDiagnosticsConfig | undefined): DiagnosticsBinding {
  return {
    config: snapshotDiagnosticsConfig(config),
    engine,
    unsubscribe: config ? engine.observeDiagnostics(config.observer, config.options) : undefined,
  }
}

function snapshotDiagnosticsConfig(config: EngineDiagnosticsConfig | undefined): DiagnosticsConfigSnapshot | undefined {
  if (config === undefined) {
    return undefined
  }
  return {
    captureValues: config.options?.captureValues,
    includeSuppressed: config.options?.includeSuppressed,
    observer: config.observer,
    onObserverError: config.options?.onObserverError,
    redact: config.options?.redact,
  }
}

function sameDiagnosticsConfig(previous: DiagnosticsConfigSnapshot | undefined, next: EngineDiagnosticsConfig | undefined): boolean {
  return (
    previous?.observer === next?.observer &&
    previous?.captureValues === next?.options?.captureValues &&
    previous?.includeSuppressed === next?.options?.includeSuppressed &&
    previous?.onObserverError === next?.options?.onObserverError &&
    previous?.redact === next?.options?.redact
  )
}

function disposeEngine({ engine, engineRef, id }: PendingEngineDispose) {
  if (id !== undefined) {
    clearRegistryEngine(id, engine)
  }
  if (engineRef) {
    getRefInternal(engineRef).clear(engine)
  }
  engine.dispose()
}

/**
 * @inline
 * @category React Hooks and Components
 */
export interface EngineProviderProps {
  /**
   * The children to render.
   */
  children: React.ReactNode
  /**
   * Optional structured propagation diagnostics for the engine lifecycle.
   * The observer is installed before `initFn`, so it can observe initialization publications.
   *
   * @remarks The observer can run while the provider is being initialized, including during server rendering.
   * Keep it free of React state updates and other render-phase side effects. Development Strict Mode can evaluate
   * engine initialization more than once, so external sinks should tolerate duplicate initialization records.
   */
  diagnostics?: EngineDiagnosticsConfig
  /**
   * Optional stable ID for storage namespacing. Use this for multi-engine apps to prevent storage key conflicts.
   * Also registers the engine in the global registry for access via `useRemote*` hooks with a string ID.
   */
  engineId?: string
  /**
   * Optional reactive ref to expose the engine instance. Created by {@link useEngineRef}.
   * Pass to `useRemote*` hooks to access the engine from sibling or ancestor components.
   *
   * @remarks An `EngineRef` should only be used with a single `EngineProvider`.
   */
  engineRef?: EngineRef
  /**
   * A callback invoked once when the engine is created. Use this to register nodes and set up subscriptions.
   */
  initFn?: (engine: Engine) => void
  /**
   * The initial values to set in the engine.
   */
  initWith?: Record<symbol, unknown>
  /**
   * The dependency array for the update effect. When any of these values change, `updateFn` is called.
   */
  updateDeps?: unknown[]
  /**
   * A callback invoked when any value in `updateDeps` changes. Use this to publish new values to the engine.
   */
  updateFn?: (engine: Engine) => void
}

/**
 * Declarative diagnostic observer configuration for {@link EngineProvider}.
 * @category React Hooks and Components
 */
export interface EngineDiagnosticsConfig {
  /** Receives immutable propagation cycle records. */
  observer: DiagnosticObserver
  /** Controls value capture, suppression records, redaction, and observer error handling. */
  options?: DiagnosticObserverOptions
}

/**
 * A provider that instantiates and provides an {@link Engine} instance that's used by the built-in hooks.
 *
 * @example
 * ```tsx
 * import { Cell, useCellValue, EngineProvider } from '@virtuoso.dev/reactive-engine-react'
 *
 * const cell$ = Cell(0)
 *
 * function MyComponent() {
 *   const cell = useCellValue(cell$)
 *   return <div>{cell}</div>
 * }
 *
 * export default function App() {
 *   const [count, setCount] = useState(0)
 *   return (
 *     <EngineProvider
 *       initFn={(engine) => engine.register(cell$)}
 *       updateFn={(engine) => engine.pub(cell$, count)}
 *       updateDeps={[count]}
 *     >
 *       <MyComponent />
 *     </EngineProvider>
 *   )
 * }
 * ```
 *
 * @category React Hooks and Components
 * @function
 */
export const EngineProvider: React.FC<EngineProviderProps> = ({
  children,
  diagnostics,
  engineId: id,
  engineRef,
  initFn,
  initWith,
  updateDeps,
  updateFn,
}) => {
  const diagnosticsBindingRef = React.useRef<DiagnosticsBinding | null>(null)
  const [engine, setEngine] = React.useState<Engine>(() => {
    const instance = new Engine(initWith, id)
    diagnosticsBindingRef.current = bindDiagnostics(instance, diagnostics)
    initFn?.(instance)
    return instance
  })
  const pendingDisposeRef = React.useRef<PendingEngineDispose | null>(null)

  useIsomorphicLayoutEffect(() => {
    let activeEngine = engine
    const pendingDispose = pendingDisposeRef.current

    if (pendingDispose?.engine === activeEngine) {
      pendingDispose.cancelled = true
      pendingDisposeRef.current = null

      if (pendingDispose.id !== id || pendingDispose.engineRef !== engineRef || pendingDispose.initWith !== initWith) {
        disposeEngine(pendingDispose)
        activeEngine = new Engine(initWith, id)
        diagnosticsBindingRef.current = bindDiagnostics(activeEngine, diagnostics)
        initFn?.(activeEngine)
        setEngine(activeEngine)
      }
    }

    if (activeEngine.isDisposed) {
      activeEngine = new Engine(initWith, id)
      diagnosticsBindingRef.current = bindDiagnostics(activeEngine, diagnostics)
      initFn?.(activeEngine)
      setEngine(activeEngine)
    }

    if (id !== undefined) {
      setRegistryEngine(id, activeEngine)
    }
    if (engineRef) {
      getRefInternal(engineRef).set(activeEngine)
    }

    return () => {
      const disposeRecord: PendingEngineDispose = {
        cancelled: false,
        engine: activeEngine,
        engineRef,
        id,
        initWith,
      }
      pendingDisposeRef.current = disposeRecord
      queueMicrotask(() => {
        if (disposeRecord.cancelled || pendingDisposeRef.current !== disposeRecord) {
          return
        }

        pendingDisposeRef.current = null
        disposeEngine(disposeRecord)
      })
    }
  }, [initWith, id, engineRef])

  useIsomorphicLayoutEffect(() => {
    const binding = diagnosticsBindingRef.current
    if (!binding || binding.engine !== engine || sameDiagnosticsConfig(binding.config, diagnostics)) {
      return
    }

    binding.unsubscribe?.()
    binding.config = snapshotDiagnosticsConfig(diagnostics)
    binding.unsubscribe = diagnostics ? engine.observeDiagnostics(diagnostics.observer, diagnostics.options) : undefined
  }, [
    diagnostics?.observer,
    diagnostics?.options?.captureValues,
    diagnostics?.options?.includeSuppressed,
    diagnostics?.options?.onObserverError,
    diagnostics?.options?.redact,
    engine,
  ])

  useIsomorphicLayoutEffect(() => {
    if (!engine.isDisposed) {
      updateFn?.(engine)
    }
  }, [engine, ...(updateDeps ?? [])])

  return engine.isDisposed ? null : <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>
}
