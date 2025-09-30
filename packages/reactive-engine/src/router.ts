/* eslint-disable @typescript-eslint/no-empty-object-type */
import * as React from 'react'

import type { NodeRef } from './types'

import { e } from './e'
import { Cell, Stream } from './nodes'
import { tap } from './utils'

type Merge<T> = {
  [K in keyof T]: T[K]
}

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
  ? Merge<ExtractPathParams<Rest> & ParseParamType<Param>>
  : Path extends `${infer _Start}{${infer Param}}${infer Rest}`
    ? Merge<ExtractPathParams<Rest> & ParseParamType<Param>>
    : {}

type ExtractQueryParams<Query extends string> = Query extends `${infer _Param}={${infer Value}}${infer Rest}`
  ? Merge<ExtractQueryParams<Rest> & ParseQueryParamType<Value>>
  : Query extends `&${infer RestQuery}`
    ? ExtractQueryParams<RestQuery>
    : {}

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

const routeDefinitions$$ = new Map<symbol, string>()
const routeComponents$$ = new Map<symbol, React.ComponentType<unknown>>()

const layoutDefinitions$$ = new Map<symbol, string>()
const layoutComponents$$ = new Map<symbol, React.ComponentType<{ children: React.ReactNode }>>()

export type RouteComponent<T> = React.ComponentType<{
  pathParams: T extends [infer Path, infer _Query] ? (keyof Path extends never ? {} : Path) : T extends Record<string, never> ? {} : T
  queryParams: T extends [infer _Path, infer Query] ? (keyof Query extends never ? {} : Query) : {}
}>

export type LayoutComponent = React.ComponentType<{ children: React.ReactNode }>

export function Route<T extends string>(routeDefinition: T, component?: RouteComponent<RouteParams<T>>): NodeRef<null | RouteParams<T>> {
  return tap(Cell<null | RouteParams<T>>(null), (route$) => {
    routeDefinitions$$.set(route$, routeDefinition)
    if (component) {
      routeComponents$$.set(route$, component as React.ComponentType<unknown>)
    }
  })
}

export function Layout(path: string, component: LayoutComponent): symbol {
  const layoutSymbol = Symbol('layout')
  layoutDefinitions$$.set(layoutSymbol, path)
  layoutComponents$$.set(layoutSymbol, component)
  return layoutSymbol
}

type PathAndQueryParams = [Record<string, unknown>, Record<string, unknown>]
type PathParams = Record<string, unknown>

export type ActiveComponent = null | React.ComponentType

export function Router(routes: NodeRef<null | PathAndQueryParams | PathParams>[], layouts?: symbol[]) {
  const currentRoute$ = Cell<null | string>(null)
  const goToUrl$ = Stream<string>()
  const component$ = Cell<ActiveComponent>(null)

  for (const route$ of routes) {
    e.sub(route$, (params, eng) => {
      const restRoutes = routes.filter((r) => r !== route$)
      const nullPayload = Object.fromEntries(restRoutes.map((r) => [r, null]))
      if (params !== null) {
        const routeDef = routeDefinitions$$.get(route$ as symbol)
        if (routeDef) {
          const interpolated = interpolateRoute(routeDef, params)
          const component = routeComponents$$.get(route$ as symbol)

          // Find matching layouts
          const matchingLayoutComponents = findMatchingLayouts(interpolated, layouts)

          // Split params into pathParams and queryParams
          let pathParams: unknown
          let queryParams: unknown
          if (Array.isArray(params)) {
            pathParams = params[0]
            queryParams = params[1]
          } else {
            pathParams = params
            queryParams = {}
          }

          // Create an assembled component that wraps the route component with layouts and passes props
          const activeComponent: ActiveComponent = component
            ? () => {
                const ComponentCasted = component as React.ComponentType<{ pathParams: typeof pathParams; queryParams: typeof queryParams }>
                let rendered: React.ReactNode = React.createElement(ComponentCasted, { pathParams, queryParams })

                // Wrap with layouts from innermost to outermost
                for (let i = matchingLayoutComponents.length - 1; i >= 0; i--) {
                  const LayoutComponent = matchingLayoutComponents[i]
                  rendered = React.createElement(LayoutComponent, null, rendered)
                }

                return rendered
              }
            : null
          eng.pubIn({ [component$]: activeComponent, [currentRoute$]: interpolated, ...nullPayload })
        }
      } else {
        // When this route becomes null, check if any other route is active
        const anyActiveRoute = routes.find((r) => r !== route$ && eng.getValue(r) !== null)
        if (!anyActiveRoute) {
          eng.pub(component$, null)
        }
      }
    })
  }

  // Subscribe to goToUrl$ to parse URLs and activate matching routes
  e.sub(goToUrl$, (url, eng) => {
    // Try to match URL against each route
    for (const route$ of routes) {
      const routeDef = routeDefinitions$$.get(route$ as symbol)
      if (routeDef) {
        const parsed = parseUrl(url, routeDef)
        if (parsed !== null) {
          // Found a match! Publish to this route
          eng.pub(route$, parsed)
          return
        }
      }
    }
  })

  return { component$, currentRoute$, goToUrl$ }
}

function findMatchingLayouts(currentPath: string, layouts?: symbol[]): React.ComponentType<{ children: React.ReactNode }>[] {
  if (!layouts || layouts.length === 0) {
    return []
  }

  // Extract path without query string
  const pathOnly = currentPath.split('?')[0]

  // Find layouts that match as prefix
  const matching = layouts
    .map((layoutSymbol) => {
      const layoutPath = layoutDefinitions$$.get(layoutSymbol)
      const layoutComponent = layoutComponents$$.get(layoutSymbol)
      return { layoutComponent, layoutPath, layoutSymbol }
    })
    .filter(({ layoutComponent, layoutPath }) => {
      if (!layoutPath || !layoutComponent) return false
      // Root path matches everything
      if (layoutPath === '/') return true
      // Check if layout path is a prefix of current path
      return pathOnly === layoutPath || pathOnly.startsWith(layoutPath + '/')
    })
    .sort((a, b) => {
      // Sort by path length: shortest first (outermost)
      return (a.layoutPath?.length ?? 0) - (b.layoutPath?.length ?? 0)
    })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .map(({ layoutComponent }) => layoutComponent!)

  return matching
}

function interpolateRoute(route: string, params: PathAndQueryParams | PathParams): string {
  let pathParams: Record<string, unknown>
  let queryParams: Record<string, unknown> | undefined

  if (Array.isArray(params)) {
    pathParams = params[0]
    queryParams = params[1]
  } else {
    pathParams = params
  }

  // Split route into path and query parts (only split on the first ?)
  const queryIndex = route.indexOf('?')
  const pathPart = queryIndex === -1 ? route : route.slice(0, queryIndex)
  const queryPart = queryIndex === -1 ? undefined : route.slice(queryIndex + 1)
  let result = pathPart

  // Interpolate path parameters
  for (const [key, value] of Object.entries(pathParams)) {
    if (Array.isArray(value)) {
      // Rest parameter - {*key}
      const pattern = new RegExp(`\\{\\*${key}\\}`, 'g')
      result = result.replace(pattern, value.join('/'))
    } else {
      // Regular parameter - {key} or {key:type}
      const pattern = new RegExp(`\\{${key}(?::[^}]*)?\\}`, 'g')
      result = result.replace(pattern, String(value))
    }
  }

  // Interpolate query parameters
  if (queryParams) {
    const searchParams = new URLSearchParams()
    const processedKeys = new Set<string>()

    function addParam(name: string, value: unknown) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          // Add array values as multiple entries with the same key
          value.forEach((v) => {
            searchParams.append(name, String(v))
          })
        } else {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          searchParams.set(name, String(value))
        }
      }
    }

    // Parse query template to extract param names (if template exists)
    if (queryPart) {
      // Matches: paramName={placeholderName} or paramName={placeholderName?} or paramName={placeholderName:type} or paramName={placeholderName?:type}
      const queryParamPattern = /(\w+)=\{([^}]+)\}/g
      const matches = [...queryPart.matchAll(queryParamPattern)]

      for (const match of matches) {
        const searchParamName = match[1]
        const placeholder = match[2]

        // Extract placeholder name from {name}, {name?}, {name:type}, or {name?:type}
        const placeholderMatch = /^(\w+)/.exec(placeholder)
        if (!placeholderMatch) continue

        const placeholderName = placeholderMatch[1]
        processedKeys.add(placeholderName)
        addParam(searchParamName, queryParams[placeholderName])
      }
    }

    // Add any additional query params not in the template
    for (const [key, value] of Object.entries(queryParams)) {
      if (!processedKeys.has(key)) {
        addParam(key, value)
      }
    }

    if (searchParams.size > 0) {
      result += '?' + searchParams.toString()
    }
  }

  return result
}

function parseUrl(url: string, routeTemplate: string): null | PathAndQueryParams | PathParams {
  // Split URL and template into path and query parts
  const urlQueryIndex = url.indexOf('?')
  const urlPath = urlQueryIndex === -1 ? url : url.slice(0, urlQueryIndex)
  const urlQuery = urlQueryIndex === -1 ? '' : url.slice(urlQueryIndex + 1)

  const templateQueryIndex = routeTemplate.indexOf('?')
  const templatePath = templateQueryIndex === -1 ? routeTemplate : routeTemplate.slice(0, templateQueryIndex)
  const templateQuery = templateQueryIndex === -1 ? '' : routeTemplate.slice(templateQueryIndex + 1)

  // Parse path parameters
  const pathParams = parsePathParams(urlPath, templatePath)
  if (pathParams === null) {
    return null // Path didn't match
  }

  // If template has query params, parse them
  if (templateQuery) {
    const queryParams = parseQueryParams(urlQuery, templateQuery)
    return [pathParams, queryParams]
  }

  // Return just path params if no query template
  return pathParams
}

function parsePathParams(urlPath: string, templatePath: string): null | Record<string, unknown> {
  // Convert template to regex pattern
  const params: Record<string, unknown> = {}
  let pattern = '^'
  const paramNames: { isRest: boolean; name: string; type: string }[] = []

  // Parse template to build regex and extract param info
  let i = 0
  while (i < templatePath.length) {
    if (templatePath[i] === '{') {
      const end = templatePath.indexOf('}', i)
      if (end === -1) break

      const paramDef = templatePath.slice(i + 1, end)
      const isRest = paramDef.startsWith('*')
      const paramName = isRest ? paramDef.slice(1) : paramDef.split(':')[0]
      const paramType = isRest ? 'string[]' : paramDef.includes(':') ? paramDef.split(':')[1] : 'string'

      paramNames.push({ isRest, name: paramName, type: paramType })

      if (isRest) {
        pattern += '(.+)'
      } else {
        pattern += '([^/]+)'
      }

      i = end + 1
    } else {
      // Escape regex special chars
      const char = templatePath[i]
      if (/[.*+?^${}()|[\]\\]/.test(char)) {
        pattern += '\\' + char
      } else {
        pattern += char
      }
      i++
    }
  }

  pattern += '$'

  // Match URL against pattern
  const regex = new RegExp(pattern)
  const match = urlPath.match(regex)

  if (!match) {
    return null
  }

  // Extract and type-cast parameters
  paramNames.forEach((paramInfo, index) => {
    const value = match[index + 1]
    if (paramInfo.isRest) {
      params[paramInfo.name] = value.split('/')
    } else if (paramInfo.type === 'number') {
      params[paramInfo.name] = Number(value)
    } else if (paramInfo.type === 'boolean') {
      params[paramInfo.name] = value === 'true'
    } else {
      params[paramInfo.name] = value
    }
  })

  return params
}

function parseQueryParams(urlQuery: string, templateQuery: string): Record<string, unknown> {
  const params: Record<string, unknown> = {}
  const urlSearchParams = new URLSearchParams(urlQuery)

  // Parse template to extract param definitions
  const templatePattern = /(\w+)=\{([^}]+)\}/g
  const matches = [...templateQuery.matchAll(templatePattern)]

  const processedQueryKeys = new Set<string>()

  for (const match of matches) {
    const queryParamName = match[1]
    const placeholder = match[2]

    // Extract type info from placeholder
    const typeMatch = /^(\w+)(\?)?(?::(.+))?$/.exec(placeholder)
    if (!typeMatch) continue

    const [, placeholderName, isOptional, typeInfo] = typeMatch as unknown as [unknown, string, string | undefined, string | undefined]
    processedQueryKeys.add(queryParamName)

    const values = urlSearchParams.getAll(queryParamName)

    if (values.length === 0) {
      if (!isOptional) {
        // Required param missing - but we still return params
      }
      continue
    }

    // Determine if it's an array type
    const isArray = typeInfo?.endsWith('[]')
    const baseType = isArray ? typeInfo?.slice(0, -2) : typeInfo

    if (isArray) {
      // Array parameter
      params[placeholderName] = values.map((v) => {
        if (baseType === 'number') return Number(v)
        if (baseType === 'boolean') return v === 'true'
        return v
      })
    } else {
      // Single value
      const value = values[0]
      if (baseType === 'number') {
        params[placeholderName] = Number(value)
      } else if (baseType === 'boolean') {
        params[placeholderName] = value === 'true'
      } else {
        params[placeholderName] = value
      }
    }
  }

  // Add any query params not in the template
  for (const [key, value] of urlSearchParams.entries()) {
    if (!processedQueryKeys.has(key)) {
      const allValues = urlSearchParams.getAll(key)
      params[key] = allValues.length > 1 ? allValues : value
    }
  }

  return params
}
