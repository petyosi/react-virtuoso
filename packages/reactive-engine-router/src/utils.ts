import invariant from 'tiny-invariant'

import type { RouteReference, RouteRefValue } from './types'

import { routeDefinitions$$ } from './Route'

export function interpolateRoute(route: string, params: NonNullable<RouteRefValue>): string {
  const { $search, ...pathParams } = params as Record<string, unknown> & { $search?: Record<string, unknown> }
  const queryParams = $search

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

        invariant(placeholder, 'Query param placeholder should exist in regex match')
        invariant(searchParamName, 'Query param name should exist in regex match')

        // Extract placeholder name from {name}, {name?}, {name:type}, or {name?:type}
        const placeholderMatch = /^(\w+)/.exec(placeholder)
        if (!placeholderMatch) continue

        const placeholderName = placeholderMatch[1]
        invariant(placeholderName, 'Placeholder name should exist in regex match')

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
      result += `?${searchParams.toString()}`
    }
  }

  return result
}

/**
 * Generates a URL string from a route reference or path, with optional parameters.
 *
 * Accepts either a string path or a RouteReference symbol, and generates a complete URL
 * by interpolating path parameters and appending search/query parameters.
 *
 * @param route - The route path string or RouteReference symbol
 * @param params - Optional parameters object containing path params and/or $search query params
 * @returns The generated URL string
 *
 * @example
 * // With string path
 * getUrl('/users/{id}', { id: '123' }) // '/users/123'
 *
 * @example
 * // With RouteReference (type-safe)
 * const user$ = Route('/users/{id}', UserComponent)
 * getUrl(user$, { id: '123' }) // '/users/123'
 *
 * @example
 * // With search parameters
 * const search$ = Route('/search?q={q?}', SearchComponent)
 * getUrl(search$, { $search: { q: 'test' } }) // '/search?q=test'
 */
export function getUrl(route: string): string
export function getUrl<T extends RouteReference>(route: T, params?: T['params']): string
export function getUrl(route: RouteReference | string, params?: Record<string, unknown>): string {
  // Extract the route definition
  let routeDefinition: string

  if (typeof route === 'symbol') {
    // It's a RouteReference (which at runtime is a symbol from Cell())
    const definition = routeDefinitions$$.get(route)
    invariant(definition, 'Route definition not found for symbol')
    routeDefinition = definition
  } else {
    // It's a string path
    routeDefinition = route
  }

  // If no params provided, return the route definition as-is
  if (!params) {
    return routeDefinition
  }

  // Use interpolateRoute to generate the URL
  return interpolateRoute(routeDefinition, params)
}

export function parseUrl(url: string, routeTemplate: string): null | (Record<string, unknown> & { $search?: Record<string, unknown> }) {
  // Split URL and template into path and query parts
  const urlQueryIndex = url.indexOf('?')
  let urlPath = urlQueryIndex === -1 ? url : url.slice(0, urlQueryIndex)
  if (urlPath === '') {
    urlPath = '/' // Normalize empty path to '/'
  }

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
    return { ...pathParams, $search: queryParams }
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
      const char = templatePath[i]
      if (/[.*+?^${}()|[\]\\]/.test(char)) {
        pattern += `\\${char}`
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
    // biome-ignore lint/style/noNonNullAssertion: ok

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
    // biome-ignore lint/style/noNonNullAssertion: ok

    const queryParamName = match[1]
    // biome-ignore lint/style/noNonNullAssertion: ok

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

/**
 * Checks if an actual path matches a pattern path using prefix matching (like layouts).
 * A pattern matches if:
 * - The pattern is '/' (matches everything)
 * - The path equals the pattern exactly
 * - The path starts with the pattern followed by '/'
 *
 * @param actualPath - The actual path to check (e.g., '/admin/users')
 * @param patternPath - The pattern path to match against (e.g., '/admin' or '/admin/')
 * @returns true if the path matches the pattern prefix
 *
 * @example
 * matchesPathPrefix('/admin/users', '/admin') // true
 * matchesPathPrefix('/admin/users', '/admin/') // true
 * matchesPathPrefix('/admin', '/admin') // true
 * matchesPathPrefix('/user', '/admin') // false
 */
export function matchesPathPrefix(actualPath: string, patternPath: string): boolean {
  // Root path matches everything
  if (patternPath === '/') return true

  // Normalize pattern by removing trailing slash (except for root)
  const normalizedPattern = patternPath.endsWith('/') && patternPath !== '/' ? patternPath.slice(0, -1) : patternPath

  // Exact match
  if (actualPath === normalizedPattern) return true
  // Prefix match (must be followed by /)
  return actualPath.startsWith(`${normalizedPattern}/`)
}

/**
 * Matches a URL against a guard pattern.
 * - If the pattern contains parameters ('{...}'), uses parseUrl for exact matching
 * - Otherwise, uses prefix matching like layouts
 *
 * @param url - The URL to match
 * @param guardPattern - The guard pattern (e.g., '/admin' or '/users/{id:number}')
 * @returns Parsed parameters if match succeeds, null otherwise
 */
export function matchGuardPattern(
  url: string,
  guardPattern: string
): null | (Record<string, unknown> & { $search?: Record<string, unknown> }) {
  // If pattern contains parameters or wildcards, use exact parseUrl matching
  if (guardPattern.includes('{')) {
    return parseUrl(url, guardPattern)
  }

  // For simple paths, use prefix matching
  const urlQueryIndex = url.indexOf('?')
  const urlPath = urlQueryIndex === -1 ? url : url.slice(0, urlQueryIndex)
  const urlQuery = urlQueryIndex === -1 ? '' : url.slice(urlQueryIndex + 1)

  const templateQueryIndex = guardPattern.indexOf('?')
  const templatePath = templateQueryIndex === -1 ? guardPattern : guardPattern.slice(0, templateQueryIndex)
  const templateQuery = templateQueryIndex === -1 ? '' : guardPattern.slice(templateQueryIndex + 1)

  // Check if path matches using prefix logic
  if (!matchesPathPrefix(urlPath, templatePath)) {
    return null
  }

  // If template has query params, parse them
  if (templateQuery) {
    const queryParams = parseQueryParams(urlQuery, templateQuery)
    return { $search: queryParams }
  }

  // Return empty object for successful prefix match
  return {}
}
