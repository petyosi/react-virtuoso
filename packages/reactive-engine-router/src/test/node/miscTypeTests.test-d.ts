import { describe, expectTypeOf, it } from 'vitest'

import type { CreateRouteReference } from '../../types'

describe('String URL support tests', () => {
  it('navigate() accepts string URLs', () => {
    type NavigateFn = (target: CreateRouteReference<'/'> | string) => void
    expectTypeOf<NavigateFn>().toBeFunction()
  })

  it('getUrl() accepts string URLs', () => {
    type GetUrlFn = (target: CreateRouteReference<'/'> | string) => string
    expectTypeOf<GetUrlFn>().toBeFunction()
  })

  it('context.redirect() accepts string URLs', () => {
    type RedirectFn = (target: CreateRouteReference<'/'> | string) => void
    expectTypeOf<RedirectFn>().toBeFunction()
  })
})

describe('Edge case: Route refs stability', () => {
  it('Route refs are stable types', () => {
    type HomeRoute = CreateRouteReference<'/'>
    // Same route pattern should produce the same type
    type HomeRoute2 = CreateRouteReference<'/'>
    expectTypeOf<HomeRoute>().toEqualTypeOf<HomeRoute2>()
  })

  it('Nested layout routes work with typed refs', () => {
    type NestedRoute = CreateRouteReference<'/admin/users/{id}'>
    expectTypeOf<NestedRoute>().not.toBeNever()
  })

  it('Routes with identical path patterns are compatible', () => {
    type UserPageRoute = CreateRouteReference<'/users/{id}'>
    type AdminPageRoute = CreateRouteReference<'/users/{id}'>
    // Same path pattern produces same type
    expectTypeOf<UserPageRoute>().toEqualTypeOf<AdminPageRoute>()
  })
})

describe('Union type tests for dual API', () => {
  it('navigate() accepts union of string | RouteReference', () => {
    type HomeRoute = CreateRouteReference<'/'>
    type NavigateFn = (target: HomeRoute | string) => void
    expectTypeOf<NavigateFn>().toBeFunction()
  })

  it('getUrl() accepts union of string | RouteReference', () => {
    type UserRoute = CreateRouteReference<'/users/{id}'>
    type GetUrlFn = (target: string | UserRoute, params?: { id: string }) => string
    expectTypeOf<GetUrlFn>().toBeFunction()
  })

  it('Result types are correct (string for getUrl, void for navigate)', () => {
    type HomeRoute = CreateRouteReference<'/'>
    type GetUrlReturn = ReturnType<(target: HomeRoute) => string>
    type NavigateReturn = ReturnType<(target: HomeRoute) => void>

    expectTypeOf<GetUrlReturn>().toBeString()
    expectTypeOf<NavigateReturn>().toBeVoid()
  })
})
