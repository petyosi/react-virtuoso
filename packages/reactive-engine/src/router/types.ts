// biome-ignore-all lint/complexity/noBannedTypes: this is ok here.

import type * as React from 'react'

import type { NodeRef } from '../types'

export type RouteParams<Route extends string> = Route extends `${infer Path}?${infer Query}`
  ? ExtractPathParams<Path> extends infer PathParams
    ? ExtractQueryParams<Query> extends infer QueryParams
      ? keyof PathParams extends never
        ? keyof QueryParams extends never
          ? {}
          : { $search: QueryParams }
        : keyof QueryParams extends never
          ? PathParams
          : PathParams & { $search: QueryParams }
      : never
    : never
  : ExtractPathParams<Route> extends infer PathParams
    ? keyof PathParams extends never
      ? {}
      : PathParams
    : never

export type ExtractQueryParams<Query extends string> = Query extends `${infer _Param}={${infer Value}}${infer Rest}`
  ? Merge<ExtractQueryParams<Rest> & ParseQueryParamType<Value>>
  : Query extends `&${infer RestQuery}`
    ? ExtractQueryParams<RestQuery>
    : {}

export type ExtractPathParams<Path extends string> = Path extends `${infer _Start}/{${infer Param}}${infer Rest}`
  ? Merge<ExtractPathParams<Rest> & ParseParamType<Param>>
  : Path extends `${infer _Start}{${infer Param}}${infer Rest}`
    ? Merge<ExtractPathParams<Rest> & ParseParamType<Param>>
    : {}

export type ParseQueryParamType<Value extends string> = Value extends `${infer Name}?:${infer Type}`
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
export type ParseParamType<Param extends string> = Param extends `*${infer Name}`
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
export type Merge<T> = {
  [K in keyof T]: T[K]
}

export type LayoutComponent = React.ComponentType<{ children: React.ReactNode }>

export type ActiveComponent = null | React.ComponentType

export type RouteRefValue = null | Record<string, unknown>

export type RouteRef = NodeRef<RouteRefValue>

/**
 * RouteReference<Params> is a branded NodeRef for type-safe route navigation.
 *
 * It provides:
 * - Compile-time type safety via generic parameter Params
 * - Zero runtime overhead (types compile to nothing)
 * - Unique symbol identity at runtime for route matching
 * - Compatibility with NodeRef<RouteRefValue> for existing router infrastructure
 *
 * @example
 * const user$ = Route('/users/{id}', UserPage)
 * // Type: RouteReference<{ id: string }, '/users/{id}'>
 * navigate(user$, { id: '123' }) // TypeScript enforces { id: string }
 *
 * @typeParam Params - The inferred parameter type from route path (e.g., { id: string })
 * @typeParam Path - The route path pattern (e.g., '/users/{id}')
 */
export type RouteReference<
  Params extends Record<string, unknown> = Record<string, unknown>,
  Path extends string = string,
> = NodeRef<null | Params> & {
  readonly params: Params
  readonly path: Path
}

/**
 * PathParamExtractor extracts parameter names from a route path pattern
 *
 * Examples:
 * - '/users' → never (no params)
 * - '/users/{id}' → 'id'
 * - '/users/{id}/posts/{postId}' → 'id' | 'postId'
 *
 * @typeParam Path - The route path pattern
 */
export type PathParamExtractor<Path extends string> = Path extends `${infer _Start}{${infer Param}}${infer Rest}`
  ? Param extends `${infer ParamName}${infer _Rest}`
    ? ParamName | PathParamExtractor<Rest>
    : PathParamExtractor<Rest>
  : never

/**
 * SearchParamType extracts and types search parameters from route definitions
 *
 * Used internally to type the $search key in params when present
 *
 * @typeParam Route - The full route definition including query string
 */
export type SearchParamType<Route extends string> = Route extends `${infer _}?${infer Query}` ? ExtractQueryParams<Query> : never

/**
 * Helper type to create a RouteReference with properly inferred types
 *
 * @example
 * type UserPageRoute = CreateRouteReference<'/users/{id}'>
 * // Results in RouteReference<{ id: string }, '/users/{id}'>
 */
export type CreateRouteReference<Route extends string> = RouteReference<RouteParams<Route>, Route>
