// Guard factory and types
export { Guard, guardDefinitions$$ } from './Guard'
export {
  type AsyncGuardResult,
  CONTINUE_RESULT,
  type ContinueResult,
  type GuardContext,
  type GuardDefinition,
  type GuardFn,
  type GuardOptions,
  type GuardRef,
  type GuardResult,
  NAVIGATE_RESULT,
  type NavigateResult,
  REDIRECT_RESULT,
  type RedirectResult,
} from './guardTypes'

// Layout components
export { findMatchingLayouts, Layout, layoutComponents$$, layoutDefinitions$$ } from './Layout'

export { LayoutSlot } from './LayoutSlot'

export type { LayoutSlotProps } from './LayoutSlot'
export { LayoutSlotFill } from './LayoutSlotFill'

export type { LayoutSlotFillProps } from './LayoutSlotFill'
export { LayoutSlotPortal } from './LayoutSlotPortal'
// Route factory
export { Route, routeComponents$$, routeDefinitions$$ } from './Route'
// Router components
export { Router } from './Router'
export type { RouterProps } from './Router'
// Router engine
export { RouterEngine } from './RouterEngine'

// Suspense support
export { SuspenceTrigger } from './SuspenceTrigger'

// Types
export type {
  ActiveComponent,
  CreateRouteReference,
  ExtractPathParams,
  ExtractQueryParams,
  LayoutComponent,
  Merge,
  ParseParamType,
  ParseQueryParamType,
  PathParamExtractor,
  RouteParams,
  RouteRef,
  RouteReference,
  RouteRefValue,
  SearchParamType,
} from './types'

// Utility functions
export { getUrl, interpolateRoute, matchesPathPrefix, matchGuardPattern, parseUrl } from './utils'

// React hooks (for use with router components)
export {
  EngineContext,
  useCell,
  useCellValue,
  useEngine,
  useIsomorphicLayoutEffect,
  usePublisher,
} from '@virtuoso.dev/reactive-engine-react'
