/**
 * Integration Tests: Type-Safe Route Navigation with RouteReference
 *
 * T013: Integration test for navigation with typed references
 * T015: Integration test for path parameter validation
 *
 * These tests verify that:
 * - navigate(route$, params) works with typed route references
 * - TypeScript enforces parameter types at compile-time
 * - Runtime navigation matches expected routes
 * - Path parameters are properly interpolated
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { Engine } from '../../Engine'
import { Route } from '../../router/Route'
import { RouterEngine } from '../../router/RouterEngine'
import { getUrl } from '../../router/utils'
import { TEST_ROUTES } from '../router/fixtures'

describe('Type-Safe Navigation with RouteReference (T013)', () => {
  let engine: Engine
  let routerEngine: ReturnType<typeof RouterEngine>

  // Create typed route references matching the test fixtures
  const home$ = Route(TEST_ROUTES.HOME)
  const user$ = Route(TEST_ROUTES.USER)
  const settings$ = Route(TEST_ROUTES.SETTINGS)
  const search$ = Route(TEST_ROUTES.SEARCH)
  const notFound$ = Route(TEST_ROUTES.NOT_FOUND)
  const login$ = Route(TEST_ROUTES.LOGIN)
  const admin$ = Route(TEST_ROUTES.ADMIN)
  const nested$ = Route(TEST_ROUTES.NESTED)

  beforeEach(() => {
    engine = new Engine()
    routerEngine = RouterEngine(engine, [home$, user$, settings$, search$, notFound$, login$, admin$, nested$])
  })

  afterEach(() => {
    routerEngine.dispose()
  })

  it('should navigate to root path using typed route reference', () => {
    // T013: Navigate with typed route reference
    engine.pub(home$, {})

    expect(engine.getValue(routerEngine.currentRoute$)).toBe('/')
  })

  it('should navigate to path with single param using typed route reference', () => {
    // T013: Navigate with path parameter
    engine.pub(user$, { id: '123' })

    expect(engine.getValue(routerEngine.currentRoute$)).toBe('/users/123')
  })

  it('should navigate to path with multiple params using typed route reference', () => {
    // T013: Navigate nested route with parameters
    engine.pub(nested$, { id: 'admin-user-1' })

    expect(engine.getValue(routerEngine.currentRoute$)).toBe('/admin/users/admin-user-1')
  })

  it('should navigate to path with search params using typed route reference', () => {
    // T013: Navigate with search parameters in $search key
    engine.pub(search$, { $search: { q: 'test query' } })

    expect(engine.getValue(routerEngine.currentRoute$)).toBe('/search?q=test+query')
  })

  it('should navigate to path with search params and pagination', () => {
    // T013: Navigate with multiple search parameters
    engine.pub(search$, { $search: { page: 2, q: 'test' } })

    expect(engine.getValue(routerEngine.currentRoute$)).toBe('/search?q=test&page=2')
  })

  it('should navigate to path without params using typed route reference', () => {
    // T013: Navigate route without parameters
    engine.pub(settings$, {})

    expect(engine.getValue(routerEngine.currentRoute$)).toBe('/settings')
  })

  it('should support multiple sequential navigations with different routes', () => {
    // T013: Sequential navigation with typed references
    engine.pub(home$, {})
    expect(engine.getValue(routerEngine.currentRoute$)).toBe('/')

    engine.pub(user$, { id: '456' })
    expect(engine.getValue(routerEngine.currentRoute$)).toBe('/users/456')

    engine.pub(settings$, {})
    expect(engine.getValue(routerEngine.currentRoute$)).toBe('/settings')
  })
})

describe('Path Parameter Validation at Runtime (T015)', () => {
  let engine: Engine
  let routerEngine: ReturnType<typeof RouterEngine>

  const home$ = Route(TEST_ROUTES.HOME)
  const user$ = Route(TEST_ROUTES.USER)
  const search$ = Route(TEST_ROUTES.SEARCH)

  beforeEach(() => {
    engine = new Engine()
    routerEngine = RouterEngine(engine, [home$, user$, search$])
  })

  afterEach(() => {
    routerEngine.dispose()
  })

  it('should handle numeric path parameters correctly', () => {
    // T015: Numeric parameters
    engine.pub(user$, { id: '999' })

    expect(engine.getValue(routerEngine.currentRoute$)).toBe('/users/999')
  })

  it('should handle special characters in search params', () => {
    // T015: Special characters in params
    engine.pub(search$, { $search: { q: 'test-value_123' } })

    expect(engine.getValue(routerEngine.currentRoute$)).toBe('/search?q=test-value_123')
  })

  it('should handle empty search params object', () => {
    // T015: Empty search params
    engine.pub(search$, { $search: {} })

    expect(engine.getValue(routerEngine.currentRoute$)).toBe('/search')
  })

  it('should handle undefined search param values', () => {
    // T015: Undefined search params
    engine.pub(search$, { $search: { page: undefined, q: undefined } })

    expect(engine.getValue(routerEngine.currentRoute$)).toBe('/search')
  })

  it('should handle URL-encodable characters correctly', () => {
    // T015: URL encoding of special characters
    engine.pub(search$, { $search: { q: 'test&special?chars=1' } })

    expect(engine.getValue(routerEngine.currentRoute$)).toBe('/search?q=test%26special%3Fchars%3D1')
  })
})

describe('getUrl() Utility in React Components (T039)', () => {
  let engine: Engine
  let routerEngine: ReturnType<typeof RouterEngine>

  const home$ = Route(TEST_ROUTES.HOME)
  const user$ = Route(TEST_ROUTES.USER)
  const settings$ = Route(TEST_ROUTES.SETTINGS)
  const search$ = Route(TEST_ROUTES.SEARCH)

  beforeEach(() => {
    engine = new Engine()
    routerEngine = RouterEngine(engine, [home$, user$, settings$, search$])
  })

  afterEach(() => {
    routerEngine.dispose()
  })

  it('should generate URL for route without params', () => {
    // T039: getUrl() can be used to generate href attributes
    const url = getUrl(home$)

    expect(url).toBe('/')
  })

  it('should generate URL for route with path params', () => {
    // T039: getUrl() generates correct URL with parameters
    const url = getUrl(user$, { id: '123' })

    expect(url).toBe('/users/123')
  })

  it('should generate URL for route with search params', () => {
    // T039: getUrl() handles search parameters
    const url = getUrl(search$, { $search: { page: 2, q: 'test query' } })

    expect(url).toBe('/search?q=test+query&page=2')
  })

  it('should handle string URLs (dual API support)', () => {
    // T039: String URLs pass through unchanged
    const url = getUrl('/custom/path')

    expect(url).toBe('/custom/path')
  })

  it('should work with multiple route references', () => {
    // T039: getUrl() can be called multiple times with different routes
    expect(getUrl(home$)).toBe('/')
    expect(getUrl(settings$)).toBe('/settings')
    expect(getUrl(user$, { id: '456' })).toBe('/users/456')
  })
})
