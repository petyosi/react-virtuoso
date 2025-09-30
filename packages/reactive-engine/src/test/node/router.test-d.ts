import { describe, expectTypeOf, it } from 'vitest'

import type { RouteParams } from '../../router'

describe('RouteParams', () => {
  it('has no params by default', () => {
    expectTypeOf<RouteParams<'/'>>().toEqualTypeOf<Record<string, never>>()
  })

  it('parses a parameter to string', () => {
    expectTypeOf<RouteParams<'/users/{user}'>>().toEqualTypeOf<[{ user: string }, Record<string, string>] | { user: string }>()
  })

  it('parses multiple parameters', () => {
    expectTypeOf<RouteParams<'/users/{user}/{org}/settings'>>().toEqualTypeOf<
      [{ org: string; user: string }, Record<string, string>] | { org: string; user: string }
    >()
  })

  it('parses multiple parameters with trailing paths', () => {
    expectTypeOf<RouteParams<'/users/{user}/{org}/settings'>>().toEqualTypeOf<
      [{ org: string; user: string }, Record<string, string>] | { org: string; user: string }
    >()
  })

  it('parses numbers', () => {
    expectTypeOf<RouteParams<'/users/{userId:number}/{orgId:number}/settings'>>().toEqualTypeOf<
      [{ orgId: number; userId: number }, Record<string, string>] | { orgId: number; userId: number }
    >()
  })

  it('supports rest segments', () => {
    expectTypeOf<RouteParams<'/users/{userId:number}/{*rest}'>>().toEqualTypeOf<
      | [
          // rest can only be a string, no need to support numbers or booleans
          { rest: string[]; userId: number },
          Record<string, string>,
        ]
      | { rest: string[]; userId: number }
    >()
  })

  it('parses search params', () => {
    expectTypeOf<RouteParams<'/users/{userId:number}/?orgId={orgId}'>>().toEqualTypeOf<
      [{ userId: number }, Record<string, unknown> & { orgId: string }]
    >()
  })

  it('supports optional search params', () => {
    expectTypeOf<RouteParams<'/users/{userId:number}/?orgId={orgId?}'>>().toEqualTypeOf<
      [{ userId: number }, Record<string, unknown> & { orgId?: string }]
    >()
  })

  it('supports array params', () => {
    expectTypeOf<RouteParams<'/users/{userId:number}/?orgIds={orgIds:number[]}'>>().toEqualTypeOf<
      [{ userId: number }, Record<string, unknown> & { orgIds?: number[] }]
    >()
  })

  it('supports optional explicitly typed params', () => {
    expectTypeOf<RouteParams<'/users/{userId:number}/?orgId={orgId?:number}'>>().toEqualTypeOf<
      [{ userId: number }, Record<string, unknown> & { orgId?: number }]
    >()
  })
})
