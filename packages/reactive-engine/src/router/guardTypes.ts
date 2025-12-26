import type { Engine } from '../Engine'
import type { RouteReference } from './types'

// Guard result types - use symbols for type discrimination
export const REDIRECT_RESULT = Symbol('redirect')
export const CONTINUE_RESULT = Symbol('continue')
export const NAVIGATE_RESULT = Symbol('navigate')

export interface RedirectResult {
  options?: Record<string, unknown>
  type: typeof REDIRECT_RESULT
  url: string
}

export interface ContinueResult {
  type: typeof CONTINUE_RESULT
}

export interface NavigateResult {
  type: typeof NAVIGATE_RESULT
  url: string
}

// biome-ignore lint/suspicious/noConfusingVoidType: void is needed for implicit return compatibility
export type GuardResult = ContinueResult | NavigateResult | RedirectResult | undefined | void

export type AsyncGuardResult = GuardResult | Promise<GuardResult>

/**
 * Guard context - what guards receive as arguments.
 * Provides navigation control methods for guard functions.
 *
 * Supports both string URLs and RouteReference objects for type-safe navigation.
 *
 * @category Router Guards
 */
export interface GuardContext<TParams = Record<string, unknown>> {
  /**
   * Creates a continue result that explicitly allows navigation to proceed.
   * Note: Returning void or undefined from a guard also allows navigation.
   *
   * @returns A continue result object
   *
   * @example
   * ```ts
   * const authGuard = Guard('/admin', (context) => {
   *   if (isAuthenticated) {
   *     return context.continue()
   *   }
   * })
   * ```
   *
   * @example
   * Destructuring also works (methods are bound):
   * ```ts
   * const guard = Guard('/path', ({ redirect, continue: cont }) => {
   *   return isAuth ? cont() : redirect('/login')
   * })
   * ```
   */
  continue: () => ContinueResult
  currentUrl: null | string
  engine: Engine
  location: {
    hash: string
    pathname: string
    search: string
  }

  /**
   * Creates a navigate result that changes the destination URL without adding a history entry.
   * Guards will continue to execute with the new target URL.
   *
   * Accepts either a string URL or a RouteReference for type-safe navigation.
   *
   * @param route - The URL string or RouteReference to navigate to
   * @param params - Route parameters (if using RouteReference)
   * @returns A navigate result object
   *
   * @example
   * ```ts
   * // String URL
   * return context.navigate('/dashboard')
   *
   * // RouteReference (type-safe)
   * const dashboard$ = Route('/dashboard', DashboardComponent)
   * // ...
   * return context.navigate(dashboard$)
   * ```
   */
  navigate: ((url: string) => NavigateResult) & (<R extends RouteReference>(route: R, params?: R['params']) => NavigateResult)

  params: TParams

  /**
   * Creates a redirect result that navigates to a new URL and adds a history entry.
   *
   * Accepts either a string URL or a RouteReference for type-safe navigation.
   *
   * @param route - The URL string or RouteReference to redirect to
   * @param paramsOrOptions - Route parameters (if using RouteReference) or redirect options (if using string)
   * @param options - Optional additional data to pass with the redirect (when using RouteReference)
   * @returns A redirect result object
   *
   * @example
   * ```ts
   * // String URL
   * return context.redirect('/login', { returnTo: context.location.pathname })
   *
   * // RouteReference (type-safe)
   * const login$ = Route('/login', LoginComponent)
   * // ...
   * return context.redirect(login$)
   * ```
   */
  redirect: ((url: string, options?: Record<string, unknown>) => RedirectResult) &
    (<R extends RouteReference>(route: R, params?: R['params'], options?: Record<string, unknown>) => RedirectResult)
}

// Guard function type
export type GuardFn<TParams = Record<string, unknown>> = (context: GuardContext<TParams>) => AsyncGuardResult

// Guard definition options
export interface GuardOptions {
  priority?: number // Lower number = higher priority, default 0
}

// Internal guard definition stored in registry
export interface GuardDefinition<TParams = Record<string, unknown>> {
  guardFn: GuardFn<TParams>
  order: number // Registration order for stable sorting
  pattern: string
  priority: number
}

// Guard reference type (symbol returned by Guard factory)
export type GuardRef = symbol
