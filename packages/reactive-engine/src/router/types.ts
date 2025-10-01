/* eslint-disable @typescript-eslint/no-empty-object-type */

import type * as React from 'react'

export type RouteParams<Route extends string> = Route extends `${infer Path}?${infer Query}`
  ? ExtractPathParams<Path> extends infer PathParams
    ? ExtractQueryParams<Query> extends infer QueryParams
      ? keyof PathParams extends never
        ? keyof QueryParams extends never
          ? Record<string, never>
          : [Record<string, never>, QueryParams & Record<string, unknown>]
        : keyof QueryParams extends never
          ? [PathParams, Record<string, unknown>] | PathParams
          : [PathParams, QueryParams & Record<string, unknown>]
      : never
    : never
  : ExtractPathParams<Route> extends infer PathParams
    ? keyof PathParams extends never
      ? Record<string, never>
      : [PathParams, Record<string, string>] | PathParams
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

export type RouteComponent<T> = React.ComponentType<{
  pathParams: T extends [infer Path, infer _Query] ? (keyof Path extends never ? {} : Path) : T extends Record<string, never> ? {} : T
  queryParams: T extends [infer _Path, infer Query] ? (keyof Query extends never ? {} : Query) : {}
}>
export type PathAndQueryParams = [Record<string, unknown>, Record<string, unknown>]
export type PathParams = Record<string, unknown>
export type ActiveComponent = null | React.ComponentType
