import * as React from 'react'

import { Engine } from '@virtuoso.dev/reactive-engine-core'

import { EngineContext, getRefInternal, setRegistryEngine, useIsomorphicLayoutEffect } from './hooks'

import type { EngineRef } from './hooks'

interface PendingEngineDispose {
  cancelled: boolean
  engine: Engine
  engineRef: EngineRef | undefined
  id: string | undefined
  initWith: Record<symbol, unknown> | undefined
}

function disposeEngine({ engine, engineRef, id }: PendingEngineDispose) {
  if (id !== undefined) {
    setRegistryEngine(id, null)
  }
  if (engineRef) {
    getRefInternal(engineRef).set(null)
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
  engineId: id,
  engineRef,
  initFn,
  initWith,
  updateDeps,
  updateFn,
}) => {
  const [engine, setEngine] = React.useState<Engine>(() => {
    const instance = new Engine(initWith, id)
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
        initFn?.(activeEngine)
        setEngine(activeEngine)
      }
    }

    if (activeEngine.isDisposed) {
      activeEngine = new Engine(initWith, id)
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
    if (!engine.isDisposed) {
      updateFn?.(engine)
    }
  }, [engine, ...(updateDeps ?? [])])

  return engine.isDisposed ? null : <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>
}
