import { assertType, describe, expectTypeOf, it } from 'vitest'

import type { CreateRouteReference, RouteParams } from '../router/types'

describe('T011: Type safety tests for route reference parameters', () => {
  it('Home route has no params', () => {
    type HomeParams = RouteParams<'/'>
    expectTypeOf<HomeParams>().toEqualTypeOf<Record<string, never>>()
  })

  it('User route has required id param', () => {
    type UserParams = RouteParams<'/users/{id}'>
    expectTypeOf<UserParams>().toEqualTypeOf<{ id: string }>()
  })

  it('User params do not allow extra properties', () => {
    type UserParams = RouteParams<'/users/{id}'>
    // @ts-expect-error extra property should not be allowed
    assertType<UserParams>({ extra: 'foo', id: '123' })
  })
})

describe('T012: Type safety tests for search parameters', () => {
  it('Search route type is not never', () => {
    type SearchRoute = CreateRouteReference<'/search?q={q?}&page={page?:number}'>
    expectTypeOf<SearchRoute>().not.toBeNever()
  })

  it('User search params include $search property', () => {
    type UserSearchParams = RouteParams<'/users/{id}?role={role?}'>
    expectTypeOf<UserSearchParams>().toExtend<{
      $search?: { role?: string }
      id: string
    }>()
  })

  it('Search params are optional', () => {
    type UserSearchParams = RouteParams<'/users/{id}?role={role?}'>
    // Can provide without search params
    assertType<UserSearchParams>({ id: '123' })
    // Can provide with search params
    assertType<UserSearchParams>({ $search: { role: 'admin' }, id: '123' })
  })
})
