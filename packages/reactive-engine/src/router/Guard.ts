import type { GuardDefinition, GuardFn, GuardOptions, GuardRef } from './guardTypes'
import type { RouteParams } from './types'

// Counter for registration order to ensure stable sorting
let guardOrder$$ = 0

// Global registries - similar to Layout pattern
export const guardDefinitions$$ = new Map<symbol, GuardDefinition>()

/**
 * Creates a guard that intercepts navigation to routes matching the specified pattern.
 * Guards can control navigation by returning redirect, continue, or navigate results.
 *
 * @param pattern - URL pattern to match (same syntax as routes: /users/{id:number}, /admin/*)
 * @param guardFn - Function that receives guard context and returns a guard result
 * @param options - Optional configuration (priority for execution order)
 * @returns A guard reference (symbol) to pass to RouterEngine
 *
 * @typeParam T - The route pattern string for type inference of path parameters
 *
 * @example
 * ```ts
 * import { Guard } from '@virtuoso.dev/reactive-engine'
 *
 * // Authentication guard - redirect to login using context.redirect()
 * const authGuard = Guard('/admin/*', (context) => {
 *   const isAuthenticated = context.engine.getValue(currentUser$)
 *   if (!isAuthenticated) {
 *     // Use context.redirect() to navigate to login
 *     return context.redirect('/login', { returnTo: context.currentUrl })
 *   }
 *   // Return void to continue navigation (or use context.continue())
 * })
 *
 * // Pass to Router
 * <Router routes={[...]} guards={[authGuard]} />
 * ```
 *
 * @category Router Guards
 */
export function Guard<T extends string>(pattern: T, guardFn: GuardFn<RouteParams<T>>, options?: GuardOptions): GuardRef {
  const guardSymbol = Symbol('guard')
  const priority = options?.priority ?? 0
  const order = guardOrder$$++

  guardDefinitions$$.set(guardSymbol, {
    guardFn: guardFn as GuardFn,
    order,
    pattern,
    priority,
  })

  return guardSymbol
}
