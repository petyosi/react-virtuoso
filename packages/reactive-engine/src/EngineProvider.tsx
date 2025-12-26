import * as React from 'react'

import { Engine } from './Engine'
import { EngineContext, useIsomorphicLayoutEffect } from './hooks'

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
   * The initial values to set in the engine.
   */
  initWith?: Record<symbol, unknown>
  /**
   * The values to update in the engine on each render.
   */
  updateWith?: Record<symbol, unknown>
}

/**
 * A provider that instantiates and provides an {@link Engine} instance that's used by the built-in hooks.
 *
 * @example
 * ```tsx
 * import { Cell, useCellValue, e, EngineProvider } from '@virtuoso.dev/reactive-engine'
 * const cell$ = Cell(0)
 *
 * function MyComponent() {
 *   const cell = useCellValue(cell$)
 *   return <div>{cell}</div>
 * }
 *
 * export default function App() {
 *   return <EngineProvider><MyComponent /></EngineProvider>
 * }
 * ```
 *
 * @category React Hooks and Components
 * @function
 */
export const EngineProvider: React.FC<EngineProviderProps> = ({ children, engineId: id, initWith, updateWith = {} }) => {
  const [engine, setEngine] = React.useState<Engine | null>(null)

  useIsomorphicLayoutEffect(() => {
    const instance = new Engine(initWith, id)
    setEngine(instance)
    return () => {
      instance.dispose()
    }
  }, [initWith, id])

  useIsomorphicLayoutEffect(() => {
    engine?.pubIn(updateWith)
  }, [updateWith, engine])

  return engine && <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>
}
