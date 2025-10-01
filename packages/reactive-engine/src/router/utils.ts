import type { PathAndQueryParams, PathParams } from './types'

export function interpolateRoute(route: string, params: PathAndQueryParams | PathParams): string {
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

export function parseUrl(url: string, routeTemplate: string): null | PathAndQueryParams | PathParams {
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
