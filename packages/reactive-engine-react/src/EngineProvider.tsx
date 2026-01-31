import { Engine } from '@virtuoso.dev/reactive-engine-core'
import * as React from 'react'

import { EngineContext, setRegistryEngine, useIsomorphicLayoutEffect } from './hooks'

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
   */
  engineId?: string
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
export const EngineProvider: React.FC<EngineProviderProps> = ({ children, engineId: id, initFn, initWith, updateDeps, updateFn }) => {
  const [engine, setEngine] = React.useState<Engine | null>(null)

  useIsomorphicLayoutEffect(() => {
    const instance = new Engine(initWith, id)
    setEngine(instance)
    initFn?.(instance)
    if (id) {
      setRegistryEngine(id, instance)
    }
    return () => {
      if (id) {
        setRegistryEngine(id, null)
      }
      instance.dispose()
    }
  }, [initWith, id])

  useIsomorphicLayoutEffect(() => {
    if (engine) {
      updateFn?.(engine)
    }
  }, [engine, ...(updateDeps ?? [])])

  return engine && <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>
}
