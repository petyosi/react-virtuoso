import type * as React from 'react'

import type { NodeRef } from '../types'
import type { RouteComponent, RouteParams } from './types'

import { Cell } from '../nodes'
import { setNodeLabel } from '../nodeUtils'
import { tap } from '../utils'

export function Route<T extends string>(routeDefinition: T, component?: RouteComponent<RouteParams<T>>): NodeRef<null | RouteParams<T>> {
  return tap(Cell<null | RouteParams<T>>(null), (route$) => {
    setNodeLabel(route$, routeDefinition)
    routeDefinitions$$.set(route$, routeDefinition)
    if (component) {
      routeComponents$$.set(route$, component as React.ComponentType<unknown>)
    }
  })
}

export const routeComponents$$ = new Map<symbol, React.ComponentType<unknown>>()
export const routeDefinitions$$ = new Map<symbol, string>()
