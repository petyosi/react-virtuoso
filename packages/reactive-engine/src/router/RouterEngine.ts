import * as React from 'react'

import type { Engine } from '../Engine'
import type { NodeRef, Subscription, UnsubscribeHandle } from '../types'
import type { ActiveComponent, RouteRef, RouteReference, RouteRefValue } from './types'

import { Cell, Stream } from '../nodes'
import { guardDefinitions$$ } from './Guard'
import {
  CONTINUE_RESULT,
  type GuardContext,
  NAVIGATE_RESULT,
  type NavigateResult,
  REDIRECT_RESULT,
  type RedirectResult,
} from './guardTypes'
import { findMatchingLayouts } from './Layout'
import { routeComponents$$, routeDefinitions$$ } from './Route'
import { SuspenceTrigger } from './SuspenceTrigger'
import { getUrl, interpolateRoute, matchGuardPattern, parseUrl } from './utils'

export function RouterEngine(eng: Engine, routes: RouteRef[], layouts?: symbol[], guards?: symbol[]) {
  const currentRoute$ = Cell<null | string>(null)
  const goToUrl$ = Stream<RouteReference | string>(false)
  const component$ = Cell<ActiveComponent>(null)

  eng.register(currentRoute$)
  eng.register(goToUrl$)
  eng.register(component$)

  const unsubscriptions: UnsubscribeHandle[] = []

  for (const route$ of routes) {
    unsubscriptions.push(
      eng.sub(
        route$,
        createRouteSubscription({
          component$,
          currentRoute$,
          goToUrl$,
          guards: guards ?? [],
          layouts: layouts ?? [],
          route$,
          routes,
        })
      )
    )
  }

  // Subscribe to goToUrl$ to parse URLs and activate matching routes
  unsubscriptions.push(
    eng.sub(goToUrl$, async (urlOrRef, eng) => {
      // Convert RouteReference to URL string if needed
      const url = typeof urlOrRef === 'string' ? urlOrRef : getUrl(urlOrRef)

      // Find matching route and publish to it
      for (const route$ of routes) {
        const routeDef = routeDefinitions$$.get(route$ as symbol)
        if (routeDef) {
          const parsed = parseUrl(url, routeDef)
          if (parsed !== null) {
            // Found a match! Publish to this route
            eng.pub(route$, parsed)
            return
          }
        }
      }
    })
  )

  function dispose() {
    for (const unsub of unsubscriptions) {
      unsub()
    }
  }

  return { component$, currentRoute$, dispose, goToUrl$ }
}

interface CreateRouteSubscriptionParams {
  component$: NodeRef<ActiveComponent>
  currentRoute$: NodeRef<null | string>
  goToUrl$: NodeRef<RouteReference | string>
  guards: symbol[]
  layouts: symbol[]
  route$: RouteRef
  routes: RouteRef[]
}

function createRouteSubscription({
  component$,
  currentRoute$,
  goToUrl$,
  guards,
  layouts,
  route$,
  routes,
}: CreateRouteSubscriptionParams): Subscription<RouteRefValue> {
  return async (params, eng) => {
    const restRoutes = routes.filter((r) => r !== route$)
    const nullPayload = Object.fromEntries(restRoutes.map((r) => [r, null]))
    if (params !== null) {
      const routeDef = routeDefinitions$$.get(route$ as symbol)
      if (routeDef) {
        const interpolated = interpolateRoute(routeDef, params)

        // STEP 1: Execute guards for this route before rendering
        const matchedGuards = guards
          .map((guardSymbol) => {
            const def = guardDefinitions$$.get(guardSymbol)
            if (!def) return null

            const parsed = matchGuardPattern(interpolated, def.pattern)
            if (parsed === null) return null

            return { def, parsed }
          })
          .filter((g): g is NonNullable<typeof g> => g !== null)
          .sort((a, b) => {
            if (a.def.priority !== b.def.priority) {
              return a.def.priority - b.def.priority
            }
            const aLen = a.def.pattern.length
            const bLen = b.def.pattern.length
            if (aLen !== bLen) {
              return aLen - bLen
            }
            return a.def.order - b.def.order
          })

        // STEP 2: Execute guards sequentially
        let targetUrl = interpolated
        const currentUrl = eng.getValue(currentRoute$)

        for (const { def, parsed } of matchedGuards) {
          const context: GuardContext = {
            continue: () => ({
              type: CONTINUE_RESULT,
            }),
            currentUrl,
            engine: eng,
            location: {
              hash: '',
              pathname: targetUrl.split('?')[0] ?? '',
              search: targetUrl.includes('?') ? (targetUrl.split('?')[1] ?? '') : '',
            },
            navigate: (route: string | symbol, params?: Record<string, unknown>) => {
              let url: string

              if (typeof route === 'symbol') {
                url = getUrl(route as RouteReference, params)
              } else {
                // It's a string URL
                url = route
              }

              return {
                type: NAVIGATE_RESULT,
                url,
              } as NavigateResult
            },
            params: { ...parsed },
            // Bound action methods using arrow functions - support both string URLs and RouteReferences
            redirect: (route: string | symbol, paramsOrOptions?: Record<string, unknown>, redirectOptions?: Record<string, unknown>) => {
              let url: string
              let resultOptions: Record<string, unknown> | undefined

              if (typeof route === 'symbol') {
                // It's a RouteReference - paramsOrOptions is params, redirectOptions is options
                url = getUrl(route as RouteReference, paramsOrOptions)
                resultOptions = redirectOptions
              } else {
                // It's a string URL - paramsOrOptions is options
                url = route
                resultOptions = paramsOrOptions
              }

              return {
                options: resultOptions,
                type: REDIRECT_RESULT,
                url,
              } as RedirectResult
            },
          }

          const result = def.guardFn(context)

          if (result instanceof Promise) {
            const interpolatedGuardUrl = interpolateRoute(def.pattern, params)
            const guardMatchingLayoutComponents = findMatchingLayouts(interpolatedGuardUrl, layouts)
            let rendered: React.ReactNode = React.createElement(SuspenceTrigger, { promise: result })

            for (let i = guardMatchingLayoutComponents.length - 1; i >= 0; i--) {
              const LayoutComponent = guardMatchingLayoutComponents[i]
              if (LayoutComponent) {
                rendered = React.createElement(LayoutComponent, null, rendered)
              }
            }
            eng.pub(component$, () => rendered)
          }

          const awaitedResult = result instanceof Promise ? await result : result

          if (!awaitedResult || awaitedResult === undefined) continue

          if ('type' in awaitedResult) {
            if (awaitedResult.type === REDIRECT_RESULT) {
              // Redirect: navigate to new URL through goToUrl$
              eng.pub(goToUrl$, awaitedResult.url)
              return
            }
            if (awaitedResult.type === NAVIGATE_RESULT) {
              // Navigate: change target URL and find matching route
              targetUrl = awaitedResult.url
              // Find and activate the route that matches the new URL
              for (const r$ of routes) {
                const rDef = routeDefinitions$$.get(r$ as symbol)
                if (rDef) {
                  const rParsed = parseUrl(targetUrl, rDef)
                  if (rParsed !== null) {
                    eng.pub(r$, rParsed)
                    return
                  }
                }
              }
              return
            }
          }
        }

        const component = routeComponents$$.get(route$ as symbol)

        // Find matching layouts
        const matchingLayoutComponents = findMatchingLayouts(interpolated, layouts)

        // Create an assembled component that wraps the route component with layouts and passes props
        const activeComponent: ActiveComponent = component
          ? () => {
              const ComponentCasted = component as React.ComponentType<typeof params>
              let rendered: React.ReactNode = React.createElement(ComponentCasted, params)

              // Wrap with layouts from innermost to outermost
              for (let i = matchingLayoutComponents.length - 1; i >= 0; i--) {
                const LayoutComponent = matchingLayoutComponents[i]
                if (LayoutComponent) {
                  rendered = React.createElement(LayoutComponent, null, rendered)
                }
              }

              return rendered
            }
          : null

        eng.pubIn({ [component$]: activeComponent, [currentRoute$]: interpolated, ...nullPayload })
      }
    } else {
      // When this route becomes null, check if any other route is active
      const anyActiveRoute = routes.find((r) => r !== route$ && eng.getValue(r) !== null)
      if (!anyActiveRoute) {
        eng.pub(component$, null)
      }
    }
  }
}
