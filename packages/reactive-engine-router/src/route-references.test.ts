/**
 * Unit Tests: getUrl() Utility Function
 *
 * These tests verify that:
 * - getUrl() generates correct URLs from route references
 * - Path parameters are properly interpolated
 * - Search parameters are correctly serialized
 * - String URLs pass through unchanged (dual API support)
 */

import { describe, expect, it } from 'vitest'

import type { RouteReference } from './types'

import { Route } from './Route'
import { getUrl } from './utils'

const TEST_ROUTES = {
  ADMIN: '/admin/{section}',
  HOME: '/',
  LOGIN: '/login',
  NESTED: '/admin/users/{id}',
  NOT_FOUND: '/404',
  SEARCH: '/search?q={q?}&page={page?:number}',
  SETTINGS: '/settings',
  USER: '/users/{id}',
} as const

const GET_URL_TEST_CASES = [
  {
    expected: '/',
    name: 'getUrl with no params',
    params: undefined,
    route: TEST_ROUTES.HOME,
  },
  {
    expected: '/users/456',
    name: 'getUrl with path param',
    params: { id: '456' },
    route: TEST_ROUTES.USER,
  },
  {
    expected: '/search?q=hello',
    name: 'getUrl with search param only',
    params: { $search: { q: 'hello' } },
    route: TEST_ROUTES.SEARCH,
  },
  {
    expected: '/search?q=world&page=1',
    name: 'getUrl with multiple search params',
    params: { $search: { page: 1, q: 'world' } },
    route: TEST_ROUTES.SEARCH,
  },
  {
    expected: '/search?q=test%26special%3Fchars%3D1',
    name: 'getUrl with URL-encodable characters',
    params: { $search: { q: 'test&special?chars=1' } },
    route: TEST_ROUTES.SEARCH,
  },
]

describe('getUrl() Utility Function', () => {
  const home$ = Route(TEST_ROUTES.HOME)
  const user$ = Route(TEST_ROUTES.USER)
  const settings$ = Route(TEST_ROUTES.SETTINGS)
  const search$ = Route(TEST_ROUTES.SEARCH)
  const admin$ = Route(TEST_ROUTES.ADMIN)
  const nested$ = Route(TEST_ROUTES.NESTED)

  describe('Routes with no parameters', () => {
    it('should generate URL for root path', () => {
      const url = getUrl(home$)
      expect(url).toBe('/')
    })

    it('should generate URL for path without params', () => {
      const url = getUrl(settings$)
      expect(url).toBe('/settings')
    })

    it('should handle empty params object', () => {
      const url = getUrl(home$, {})
      expect(url).toBe('/')
    })
  })

  describe('Routes with path parameters', () => {
    it('should interpolate single path parameter', () => {
      const url = getUrl(user$, { id: '123' })
      expect(url).toBe('/users/123')
    })

    it('should interpolate multiple path parameters', () => {
      const url = getUrl(nested$, { id: 'admin-user-1' })
      expect(url).toBe('/admin/users/admin-user-1')
    })

    it('should interpolate path parameter with different values', () => {
      expect(getUrl(user$, { id: '456' })).toBe('/users/456')
      expect(getUrl(user$, { id: '789' })).toBe('/users/789')
    })

    it('should handle numeric path parameters as strings', () => {
      const url = getUrl(admin$, { section: 'dashboard' })
      expect(url).toBe('/admin/dashboard')
    })
  })

  describe('Routes with search parameters', () => {
    it('should generate URL with single search param', () => {
      const url = getUrl(search$, { $search: { q: 'hello' } })
      expect(url).toBe('/search?q=hello')
    })

    it('should generate URL with multiple search params', () => {
      const url = getUrl(search$, { $search: { page: 1, q: 'world' } })
      expect(url).toBe('/search?q=world&page=1')
    })

    it('should handle empty search params object', () => {
      const url = getUrl(search$, { $search: {} })
      expect(url).toBe('/search')
    })

    it('should handle undefined search param values', () => {
      const url = getUrl(search$, { $search: { page: undefined, q: undefined } })
      expect(url).toBe('/search')
    })

    it('should URL-encode special characters in search params', () => {
      const url = getUrl(search$, { $search: { q: 'test&special?chars=1' } })
      expect(url).toBe('/search?q=test%26special%3Fchars%3D1')
    })

    it('should encode spaces as + in search params', () => {
      const url = getUrl(search$, { $search: { q: 'test query' } })
      expect(url).toBe('/search?q=test+query')
    })
  })

  describe('String URL support', () => {
    it('should pass through string URL unchanged', () => {
      const url = getUrl('/')
      expect(url).toBe('/')
    })

    it('should pass through string URL with path', () => {
      const url = getUrl('/users/123')
      expect(url).toBe('/users/123')
    })

    it('should pass through string URL with query params', () => {
      const url = getUrl('/search?q=test')
      expect(url).toBe('/search?q=test')
    })
  })

  describe('Fixture test cases', () => {
    it('should match all GET_URL_TEST_CASES from fixtures', () => {
      const routeMap: Record<string, RouteReference> = {
        [TEST_ROUTES.HOME]: home$,
        [TEST_ROUTES.SEARCH]: search$,
        [TEST_ROUTES.SETTINGS]: settings$,
        [TEST_ROUTES.USER]: user$,
      }

      for (const testCase of GET_URL_TEST_CASES) {
        const route$ = routeMap[testCase.route] ?? home$
        const url = getUrl(route$, testCase.params)
        expect(url, `Test case "${testCase.name}" failed`).toBe(testCase.expected)
      }
    })
  })

  describe('Edge cases', () => {
    it('should handle routes with special characters in path params', () => {
      const url = getUrl(user$, { id: 'user-with-dashes' })
      expect(url).toBe('/users/user-with-dashes')
    })

    it('should handle routes with underscore in path params', () => {
      const url = getUrl(user$, { id: 'user_with_underscore' })
      expect(url).toBe('/users/user_with_underscore')
    })

    it('should handle numeric search param values', () => {
      const url = getUrl(search$, { $search: { page: 42 } })
      expect(url).toBe('/search?page=42')
    })

    it('should handle mixed path and search params', () => {
      const url = getUrl(nested$, { id: 'test-user' })
      expect(url).toBe('/admin/users/test-user')
    })
  })
})
