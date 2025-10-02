import * as React from 'react'

import type { Engine } from '../Engine'
import type { NodeRef, Subscription } from '../types'
import type { ActiveComponent, PathAndQueryParams, PathParams } from './types'

import { Cell, Stream } from '../nodes'
import { findMatchingLayouts } from './Layout'
import { routeComponents$$, routeDefinitions$$ } from './Route'
import { interpolateRoute, parseUrl } from './utils'

type RouteRef = NodeRef<null | PathAndQueryParams | PathParams>

export function RouterEngine(eng: Engine, routes: RouteRef[], layouts?: symbol[]) {
  const currentRoute$ = Cell<null | string>(null)
  const goToUrl$ = Stream<string>()
  const component$ = Cell<ActiveComponent>(null)

  eng.register(currentRoute$)
  eng.register(goToUrl$)
  eng.register(component$)

  for (const route$ of routes) {
    eng.sub(route$, createRouteSubscription({ component$, currentRoute$, layouts: layouts ?? [], route$, routes }))
  }

  // Subscribe to goToUrl$ to parse URLs and activate matching routes
  eng.sub(goToUrl$, (url, eng) => {
    // Try to match URL against each route
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

  return { component$, currentRoute$, goToUrl$ }
}

interface CreateRouteSubscriptionParams {
  component$: NodeRef<ActiveComponent>
  currentRoute$: NodeRef<null | string>
  layouts: symbol[]
  route$: RouteRef
  routes: RouteRef[]
}

function createRouteSubscription({
  component$,
  currentRoute$,
  layouts,
  route$,
  routes,
}: CreateRouteSubscriptionParams): Subscription<null | PathAndQueryParams | PathParams> {
  return (params, eng) => {
    const restRoutes = routes.filter((r) => r !== route$)
    const nullPayload = Object.fromEntries(restRoutes.map((r) => [r, null]))
    if (params !== null) {
      const routeDef = routeDefinitions$$.get(route$ as symbol)
      if (routeDef) {
        const interpolated = interpolateRoute(routeDef, params)
        const component = routeComponents$$.get(route$ as symbol)

        // Find matching layouts
        const matchingLayoutComponents = findMatchingLayouts(interpolated, layouts)

        // Split params into pathParams and queryParams
        let pathParams: unknown
        let queryParams: unknown
        if (Array.isArray(params)) {
          pathParams = params[0]
          queryParams = params[1]
        } else {
          pathParams = params
          queryParams = {}
        }

        // Create an assembled component that wraps the route component with layouts and passes props
        const activeComponent: ActiveComponent = component
          ? () => {
              const ComponentCasted = component as React.ComponentType<{ pathParams: typeof pathParams; queryParams: typeof queryParams }>
              let rendered: React.ReactNode = React.createElement(ComponentCasted, { pathParams, queryParams })

              // Wrap with layouts from innermost to outermost
              for (let i = matchingLayoutComponents.length - 1; i >= 0; i--) {
                const LayoutComponent = matchingLayoutComponents[i]
                rendered = React.createElement(LayoutComponent, null, rendered)
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
