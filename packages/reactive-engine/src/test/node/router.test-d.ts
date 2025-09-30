/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable perfectionist/sort-intersection-types */
import { describe, expectTypeOf, it } from 'vitest'

type ParseParamType<Param extends string> = Param extends `*${infer Name}`
  ? Record<Name, string[]>
  : Param extends `${infer Name}:${infer Type}`
    ? Type extends 'number'
      ? Record<Name, number>
      : Type extends 'boolean'
        ? Record<Name, boolean>
        : Type extends `${infer BaseType}[]`
          ? BaseType extends 'number'
            ? Record<Name, number[]>
            : BaseType extends 'boolean'
              ? Record<Name, boolean[]>
              : Record<Name, string[]>
          : Record<Name, string>
    : Record<Param, string>

type ParseQueryParamType<Value extends string> = Value extends `${infer Name}?:${infer Type}`
  ? Type extends 'number'
    ? Partial<Record<Name, number>>
    : Type extends 'boolean'
      ? Partial<Record<Name, boolean>>
      : Type extends `${infer BaseType}[]`
        ? BaseType extends 'number'
          ? Partial<Record<Name, number[]>>
          : BaseType extends 'boolean'
            ? Partial<Record<Name, boolean[]>>
            : Partial<Record<Name, string[]>>
        : Partial<Record<Name, string>>
  : Value extends `${infer Name}?`
    ? Partial<Record<Name, string>>
    : Value extends `${infer Name}:${infer Type}`
      ? Type extends 'number'
        ? Record<Name, number>
        : Type extends 'boolean'
          ? Record<Name, boolean>
          : Type extends `${infer BaseType}[]`
            ? BaseType extends 'number'
              ? Partial<Record<Name, number[]>>
              : BaseType extends 'boolean'
                ? Partial<Record<Name, boolean[]>>
                : Partial<Record<Name, string[]>>
            : Record<Name, string>
      : Record<Value, string>

type ExtractPathParams<Path extends string> = Path extends `${infer _Start}/{${infer Param}}${infer Rest}`
  ? ParseParamType<Param> & ExtractPathParams<Rest>
  : Path extends `${infer _Start}{${infer Param}}${infer Rest}`
    ? ParseParamType<Param> & ExtractPathParams<Rest>
    : {}

type ExtractQueryParams<Query extends string> = Query extends `${infer _Param}={${infer Value}}${infer Rest}`
  ? ParseQueryParamType<Value> & ExtractQueryParams<Rest>
  : Query extends `&${infer RestQuery}`
    ? ExtractQueryParams<RestQuery>
    : {}

type RouteParams<Route extends string> = Route extends `${infer Path}?${infer Query}`
  ? ExtractPathParams<Path> extends infer PathParams
    ? ExtractQueryParams<Query> extends infer QueryParams
      ? keyof PathParams extends never
        ? keyof QueryParams extends never
          ? never
          : { queryParams: QueryParams }
        : keyof QueryParams extends never
          ? { pathParams: PathParams }
          : { pathParams: PathParams; queryParams: QueryParams }
      : never
    : never
  : ExtractPathParams<Route> extends infer PathParams
    ? keyof PathParams extends never
      ? never
      : { pathParams: PathParams }
    : never

describe('RouteParams', () => {
  it('has no params by default', () => {
    expectTypeOf<RouteParams<'/'>>().toEqualTypeOf<never>()
  })

  it('parses a parameter to string', () => {
    expectTypeOf<RouteParams<'/users/{user}'>>().toMatchObjectType<{ pathParams: { user: string } }>()
  })

  it('parses multiple parameters', () => {
    expectTypeOf<RouteParams<'/users/{user}/{org}/settings'>>().toMatchObjectType<{ pathParams: { org: string; user: string } }>()
  })

  it('parses multiple parameters with trailing paths', () => {
    expectTypeOf<RouteParams<'/users/{user}/{org}/settings'>>().toMatchObjectType<{ pathParams: { org: string; user: string } }>()
  })

  it('parses numbers', () => {
    expectTypeOf<RouteParams<'/users/{userId:number}/{orgId:number}/settings'>>().toMatchObjectType<{
      pathParams: { orgId: number; userId: number }
    }>()
  })

  it('supports rest segments', () => {
    expectTypeOf<RouteParams<'/users/{userId:number}/{*rest}'>>().toMatchObjectType<{
      // rest can only be a string, no need to support numbers or booleans
      pathParams: { rest: string[]; userId: number }
    }>()
  })

  it('parses search params', () => {
    expectTypeOf<RouteParams<'/users/{userId:number}/?orgId={orgId}'>>().toMatchObjectType<{
      pathParams: { userId: number }
      queryParams: { orgId: string }
    }>()
  })

  it('supports optional search params', () => {
    expectTypeOf<RouteParams<'/users/{userId:number}/?orgId={orgId?}'>>().toMatchObjectType<{
      pathParams: { userId: number }
      queryParams: { orgId?: string }
    }>()
  })

  it('supports array params', () => {
    expectTypeOf<RouteParams<'/users/{userId:number}/?orgIds={orgIds:number[]}'>>().toMatchObjectType<{
      pathParams: { userId: number }
      queryParams: { orgIds?: number[] }
    }>()
  })

  it('supports optional explicitly typed params', () => {
    expectTypeOf<RouteParams<'/users/{userId:number}/?orgId={orgId?:number}'>>().toMatchObjectType<{
      pathParams: { userId: number }
      queryParams: { orgId?: number }
    }>()
  })
})
