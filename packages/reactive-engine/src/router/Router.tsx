import * as React from 'react'

import type { NodeRef } from '../types'
import type { PathAndQueryParams, PathParams } from './types'

import { useCellValue, useEngine, useIsomorphicLayoutEffect, usePublisher } from '../react'
import { RouterEngine } from './RouterEngine'

/**
 * Props for the Router component
 */

export interface RouterProps {
  /**
   * Optional base path for sub-mounting (e.g., "/app")
   */
  basePath?: string
  layouts?: symbol[]
  routes: NodeRef<null | PathAndQueryParams | PathParams>[]
  /**
   * Whether to integrate with browser history (default: true)
   */
  useBrowserHistory?: boolean
}

/**
 * Router component that renders the active route component and optionally integrates with browser history.
 *
 * @example
 * ```tsx
 * import { Route, Router, RouterEngine } from '@virtuoso.dev/reactive-engine'
 *
 * const Home = ({ params }) => <div>Home</div>
 * const User = ({ params }) => <div>User: {params.userId}</div>
 *
 * const home$ = Route('/', Home)
 * const user$ = Route('/users/{userId:number}', User)
 *
 * function App() {
 *   return (
 *     <EngineProvider>
 *       <Router routes={[home$, user$]} />
 *     </EngineProvider>
 *   )
 * }
 * ```
 *
 * @category React Hooks and Components
 */
export const Router: React.FC<RouterProps> = ({ basePath = '', layouts, routes, useBrowserHistory: shouldUseBrowserHistory = true }) => {
  const engine = useEngine()
  const routerEngine = React.useMemo(() => {
    return RouterEngine(engine, routes, layouts)
  }, [routes, layouts, engine])
  const ActiveComponent = useCellValue(routerEngine.component$)

  if (shouldUseBrowserHistory) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useBrowserHistory(routerEngine, basePath)
  }

  return ActiveComponent && <ActiveComponent />
}

/**
 * Hook that integrates Router with browser history.
 * Syncs route changes to browser history and listens to popstate events.
 *
 * @param goToUrl$ - Stream to publish URL changes to
 * @param currentRoute$ - Cell that emits current route path
 * @param basePath - Optional base path for sub-mounting (e.g., "/app")
 *
 * @category React Hooks and Components
 */

function useBrowserHistory(routerEngine: ReturnType<typeof RouterEngine>, basePath = '') {
  const publishUrl = usePublisher(routerEngine.goToUrl$)
  const engine = useEngine()

  // Publish initial URL on mount
  useIsomorphicLayoutEffect(() => {
    const currentPath = window.location.pathname + window.location.search
    const pathWithoutBase = basePath ? currentPath.replace(new RegExp(`^${basePath}`), '') : currentPath
    publishUrl(pathWithoutBase || '/')
  }, [])

  // Listen to popstate events (back/forward buttons)
  React.useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname + window.location.search
      const pathWithoutBase = basePath ? currentPath.replace(new RegExp(`^${basePath}`), '') : currentPath
      publishUrl(pathWithoutBase || '/')
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [publishUrl, basePath])

  // Push route changes to browser history
  React.useEffect(() => {
    return engine.sub(routerEngine.currentRoute$, (route) => {
      if (route !== null) {
        const fullPath = basePath + route
        if (window.location.pathname + window.location.search !== fullPath) {
          window.history.pushState({}, '', fullPath)
        }
      }
    })
  }, [engine, routerEngine, basePath])
}
