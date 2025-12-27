import { describe, expectTypeOf, it } from 'vitest'

import type { RouteParams } from '../../types'

describe('RouteParams', () => {
  it('has no params by default', () => {
    expectTypeOf<RouteParams<'/'>>().toEqualTypeOf<Record<string, never>>()
  })

  it('parses a parameter to string', () => {
    expectTypeOf<RouteParams<'/users/{user}'>>().toEqualTypeOf<{
      user: string
    }>()
  })

  it('parses multiple parameters', () => {
    expectTypeOf<RouteParams<'/users/{user}/{org}/settings'>>().toEqualTypeOf<{
      org: string
      user: string
    }>()
  })

  it('parses multiple parameters with trailing paths', () => {
    expectTypeOf<RouteParams<'/users/{user}/{org}/settings'>>().toEqualTypeOf<{
      org: string
      user: string
    }>()
  })

  it('parses numbers', () => {
    expectTypeOf<RouteParams<'/users/{userId:number}/{orgId:number}/settings'>>().toEqualTypeOf<{
      orgId: number
      userId: number
    }>()
  })

  it('supports rest segments', () => {
    expectTypeOf<RouteParams<'/users/{userId:number}/{*rest}'>>().toEqualTypeOf<{
      // rest can only be a string, no need to support numbers or booleans
      rest: string[]
      userId: number
    }>()
  })

  it('parses search params', () => {
    type Result = RouteParams<'/users/{userId:number}/?orgId={orgId}'>
    expectTypeOf<Result>().toExtend<{ $search: { orgId: string }; userId: number }>()
  })

  it('supports optional search params', () => {
    type Result = RouteParams<'/users/{userId:number}/?orgId={orgId?}'>
    expectTypeOf<Result>().toExtend<{ $search?: { orgId?: string }; userId: number }>()
  })

  it('supports array params', () => {
    type Result = RouteParams<'/users/{userId:number}/?orgIds={orgIds:number[]}'>
    expectTypeOf<Result>().toExtend<{ $search?: { orgIds?: number[] }; userId: number }>()
  })

  it('supports optional explicitly typed params', () => {
    type Result = RouteParams<'/users/{userId:number}/?orgId={orgId?:number}'>
    expectTypeOf<Result>().toExtend<{ $search?: { orgId?: number }; userId: number }>()
  })
})
