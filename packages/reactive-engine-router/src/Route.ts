import type * as React from 'react'

import { Cell } from '@virtuoso.dev/reactive-engine-core'

import type { CreateRouteReference, RouteParams } from './types'

/**
 * Route factory creates a typed route reference with compile-time parameter validation.
 *
 * Route references are unique symbols that:
 * - Provide type safety for path and search parameters
 * - Have zero runtime overhead (types compile out)
 * - Can be used with navigate() and guard context methods
 * - Support both string URLs and typed references
 *
 * @param routeDefinition - The route path pattern (e.g., '/users/{id}' or '/search?q={q}')
 * @param component - Optional React component to render when this route is active
 * @returns A typed route reference (symbol at runtime, generic type at compile-time)
 *
 */
export function Route<T extends string>(routeDefinition: T, component?: React.ComponentType<RouteParams<T>>): CreateRouteReference<T> {
  const route$ = Cell<null | RouteParams<T>>(null)

  // Store the route definition for runtime lookups
  routeDefinitions$$.set(route$ as symbol, routeDefinition)

  if (component) {
    routeComponents$$.set(route$ as symbol, component as React.ComponentType<unknown>)
  }

  return route$ as CreateRouteReference<T>
}

/**
 * Runtime storage for route components by symbol
 * Maps from unique symbol to the React component that renders this route
 * Used for component rendering in RouterEngine
 */
export const routeComponents$$ = new Map<symbol, React.ComponentType<unknown>>()

/**
 * Runtime storage for route definitions by symbol
 * Maps from unique symbol (created by Cell()) to route path pattern
 * Used for URL matching and interpolation
 */
export const routeDefinitions$$ = new Map<symbol, string>()
