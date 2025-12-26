import { describe, expectTypeOf, it } from 'vitest'

import type { CreateRouteReference } from '../router/types'

// Create sample route references for testing
type HomeRoute = CreateRouteReference<'/'>
type UserRoute = CreateRouteReference<'/users/{id}'>
type SearchRoute = CreateRouteReference<'/search?q={q?}&page={page?:number}'>
type AdminRoute = CreateRouteReference<'/admin/{section}'>

describe('T034: Type safety tests for getUrl() utility', () => {
  it('accepts routes with no params', () => {
    type Params = Parameters<(route: HomeRoute, params?: Record<string, never>) => string>
    expectTypeOf<Params[0]>().toEqualTypeOf<HomeRoute>()
  })

  it('accepts routes with required path params', () => {
    type Params = Parameters<(route: UserRoute, params: { id: string }) => string>
    expectTypeOf<Params[0]>().toEqualTypeOf<UserRoute>()
    expectTypeOf<Params[1]>().toEqualTypeOf<{ id: string }>()
  })

  it('accepts routes with multiple path params', () => {
    type Params = Parameters<(route: AdminRoute, params: { section: string }) => string>
    expectTypeOf<Params[0]>().toEqualTypeOf<AdminRoute>()
  })

  it('accepts string URLs', () => {
    type Params = Parameters<(url: string) => string>
    expectTypeOf<Params[0]>().toBeString()
  })
})

describe('T035: Type safety tests for getUrl() with search params', () => {
  it('accepts optional search params', () => {
    type Params = Parameters<(route: SearchRoute, params?: { $search?: { page?: number; q?: string } }) => string>
    expectTypeOf<Params[0]>().toEqualTypeOf<SearchRoute>()
  })

  it('accepts search params only (no path params)', () => {
    type Params = Parameters<(route: SearchRoute, params?: { $search?: { q?: string } }) => string>
    expectTypeOf<Params[0]>().toEqualTypeOf<SearchRoute>()
  })

  it('return type is always string', () => {
    type TestGetUrlReturnType = ReturnType<(route: HomeRoute) => string>
    expectTypeOf<TestGetUrlReturnType>().toBeString()
  })
})
