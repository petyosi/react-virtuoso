import * as React from 'react'

import { Engine } from './engine'
import { TracerConsole } from './Tracer'

/**
 * @category React Components
 * The context that provides the engine to the built-in hooks.
 */
export const EngineContext = React.createContext<Engine | null>(null)

/**
 * @category React Components
 */
export function EngineProvider({
  children,
  console,
  initWith,
  updateWith = {},
}: {
  /**
   * The children to render
   */
  children: React.ReactNode
  /**
   * A console instance (usually, the browser console, but you can pass your own logger) that enables diagnostic messages about the engine state cycles.
   */
  console?: TracerConsole
  /**
   * The initial values to set in the engine
   */
  initWith?: Record<string, unknown>
  /**
   * The values to update in the engine on each render
   */
  updateWith?: Record<string, unknown>
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const engineInstance = React.useMemo(() => new Engine(initWith), [])

  React.useEffect(() => {
    engineInstance.setTracerConsole(console)
  }, [console, engineInstance])

  React.useEffect(() => {
    engineInstance.pubIn(updateWith)
  }, [updateWith, engineInstance])

  return <EngineContext.Provider value={engineInstance}>{children}</EngineContext.Provider>
}
