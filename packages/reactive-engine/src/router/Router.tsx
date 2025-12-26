import * as React from 'react'

import type { RouteRef } from './types'

import { useCellValue, useEngine, useIsomorphicLayoutEffect, usePublisher } from '../hooks'
import { RouterEngine } from './RouterEngine'

/**
 * Props for the Router component
 */

export interface RouterProps {
  /**
   * Optional base path for sub-mounting (e.g., "/app")
   */
  basePath?: string
  /**
   * Optional guards to intercept navigation
   */
  guards?: symbol[]
  layouts?: symbol[]
  routes: RouteRef[]
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
export const Router: React.FC<RouterProps> = ({
  basePath = '',
  guards,
  layouts,
  routes,
  useBrowserHistory: shouldUseBrowserHistory = true,
}) => {
  const engine = useEngine()
  const [routerEngine, setRouterEngine] = React.useState<null | ReturnType<typeof RouterEngine>>(null)

  useIsomorphicLayoutEffect(() => {
    const instance = RouterEngine(engine, routes, layouts, guards)
    setRouterEngine(instance)
    return () => {
      instance.dispose()
    }
  }, [engine, ...routes, ...(layouts ?? []), ...(guards ?? [])])

  return routerEngine && <RouterRender basePath={basePath} routerEngine={routerEngine} useBrowserHistory={shouldUseBrowserHistory} />
}

const RouterRender: React.FC<{
  basePath: string
  routerEngine: ReturnType<typeof RouterEngine>
  useBrowserHistory: boolean
}> = ({ basePath, routerEngine, useBrowserHistory: shouldUseBrowserHistory }) => {
  useBrowserHistory(routerEngine, basePath, shouldUseBrowserHistory)
  const ActiveComponent = useCellValue(routerEngine.component$)
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

function useBrowserHistory(routerEngine: ReturnType<typeof RouterEngine>, basePath = '', enable: boolean) {
  const publishUrl = usePublisher(routerEngine.goToUrl$)
  const engine = useEngine()

  // Publish initial URL on mount
  useIsomorphicLayoutEffect(() => {
    if (enable) {
      const currentPath = window.location.pathname + window.location.search
      const pathWithoutBase = basePath ? currentPath.replace(new RegExp(`^${basePath}`), '') : currentPath
      publishUrl(pathWithoutBase || '/')
    }
  }, [enable, publishUrl, basePath])

  // Listen to popstate events (back/forward buttons)
  React.useEffect(() => {
    if (enable) {
      const handlePopState = () => {
        const currentPath = window.location.pathname + window.location.search
        const pathWithoutBase = basePath ? currentPath.replace(new RegExp(`^${basePath}`), '') : currentPath
        publishUrl(pathWithoutBase || '/')
      }

      window.addEventListener('popstate', handlePopState)
      return () => {
        window.removeEventListener('popstate', handlePopState)
      }
    }
  }, [publishUrl, basePath, enable])

  // Push route changes to browser history
  React.useEffect(() => {
    if (enable) {
      return engine.sub(routerEngine.currentRoute$, (route) => {
        if (route !== null) {
          const fullPath = basePath + route
          if (window.location.pathname + window.location.search !== fullPath) {
            window.history.pushState({}, '', fullPath)
          }
        }
      })
    }
  }, [engine, routerEngine, basePath, enable])
}
