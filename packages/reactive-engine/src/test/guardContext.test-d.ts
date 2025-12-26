import { describe, expectTypeOf, it } from 'vitest'

import type { CreateRouteReference } from '../router/types'

// Create sample route references for testing
type HomeRoute = CreateRouteReference<'/'>
type LoginRoute = CreateRouteReference<'/login'>
type UserRoute = CreateRouteReference<'/users/{id}'>
type SearchRoute = CreateRouteReference<'/search?q={q?}&page={page?:number}'>

describe('T023: Type safety tests for guard context methods', () => {
  it('redirect() accepts routes without params', () => {
    type Params = Parameters<(route: LoginRoute, params?: Record<string, never>) => void>
    expectTypeOf<Params[0]>().toEqualTypeOf<LoginRoute>()
  })

  it('redirect() accepts routes with params', () => {
    type Params = Parameters<(route: UserRoute, params: { id: string }) => void>
    expectTypeOf<Params[0]>().toEqualTypeOf<UserRoute>()
    expectTypeOf<Params[1]>().toEqualTypeOf<{ id: string }>()
  })

  it('redirect() accepts string URLs', () => {
    type Params = Parameters<(url: string, options?: Record<string, unknown>) => void>
    expectTypeOf<Params[0]>().toBeString()
  })
})

describe('T024: Type safety tests for guard params', () => {
  it('navigate() accepts routes without params', () => {
    type Params = Parameters<(route: HomeRoute, params?: Record<string, never>) => void>
    expectTypeOf<Params[0]>().toEqualTypeOf<HomeRoute>()
  })

  it('navigate() accepts routes with params', () => {
    type Params = Parameters<(route: UserRoute, params: { id: string }) => void>
    expectTypeOf<Params[0]>().toEqualTypeOf<UserRoute>()
    expectTypeOf<Params[1]>().toEqualTypeOf<{ id: string }>()
  })

  it('navigate() accepts string URLs', () => {
    type Params = Parameters<(url: string) => void>
    expectTypeOf<Params[0]>().toBeString()
  })

  it('guard context methods accept search params', () => {
    type RedirectParams = Parameters<(route: SearchRoute, params?: { $search?: { page?: number; q?: string } }) => void>
    expectTypeOf<RedirectParams[0]>().toEqualTypeOf<SearchRoute>()
  })
})
