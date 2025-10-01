import type * as React from 'react'

import type { LayoutComponent } from './types'

export function Layout(path: string, component: LayoutComponent): symbol {
  const layoutSymbol = Symbol('layout')
  layoutDefinitions$$.set(layoutSymbol, path)
  layoutComponents$$.set(layoutSymbol, component)
  return layoutSymbol
}
export function findMatchingLayouts(currentPath: string, layouts?: symbol[]): React.ComponentType<{ children: React.ReactNode }>[] {
  if (!layouts || layouts.length === 0) {
    return []
  }

  // Extract path without query string
  const pathOnly = currentPath.split('?')[0]

  // Find layouts that match as prefix
  const matching = layouts
    .map((layoutSymbol) => {
      const layoutPath = layoutDefinitions$$.get(layoutSymbol)
      const layoutComponent = layoutComponents$$.get(layoutSymbol)
      return { layoutComponent, layoutPath, layoutSymbol }
    })
    .filter(({ layoutComponent, layoutPath }) => {
      if (!layoutPath || !layoutComponent) return false
      // Root path matches everything
      if (layoutPath === '/') return true
      // Check if layout path is a prefix of current path
      return pathOnly === layoutPath || pathOnly.startsWith(layoutPath + '/')
    })
    .sort((a, b) => {
      // Sort by path length: shortest first (outermost)
      return (a.layoutPath?.length ?? 0) - (b.layoutPath?.length ?? 0)
    })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .map(({ layoutComponent }) => layoutComponent!)

  return matching
}
export const layoutDefinitions$$ = new Map<symbol, string>()
export const layoutComponents$$ = new Map<symbol, React.ComponentType<{ children: React.ReactNode }>>()
