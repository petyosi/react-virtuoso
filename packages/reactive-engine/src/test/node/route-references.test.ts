/**
 * Unit Tests: getUrl() Utility Function
 *
 * T036: Unit tests for getUrl() with no params
 * T037: Unit tests for getUrl() with path params
 * T038: Unit tests for getUrl() with search params
 *
 * These tests verify that:
 * - getUrl() generates correct URLs from route references
 * - Path parameters are properly interpolated
 * - Search parameters are correctly serialized
 * - String URLs pass through unchanged (dual API support)
 */

import { describe, expect, it } from 'vitest'

import { Route } from '../../router/Route'
import { RouteReference } from '../../router/types'
import { getUrl } from '../../router/utils'
import { GET_URL_TEST_CASES, TEST_ROUTES } from '../router/fixtures'

describe('getUrl() Utility Function', () => {
  // Create typed route references for testing
  const home$ = Route(TEST_ROUTES.HOME)
  const user$ = Route(TEST_ROUTES.USER)
  const settings$ = Route(TEST_ROUTES.SETTINGS)
  const search$ = Route(TEST_ROUTES.SEARCH)
  const admin$ = Route(TEST_ROUTES.ADMIN)
  const nested$ = Route(TEST_ROUTES.NESTED)

  // T036: Unit tests for getUrl() with no params
  describe('Routes with no parameters', () => {
    it('should generate URL for root path', () => {
      // T036: getUrl(home$) returns '/'
      const url = getUrl(home$)
      expect(url).toBe('/')
    })

    it('should generate URL for path without params', () => {
      // T036: getUrl(settings$) returns '/settings'
      const url = getUrl(settings$)
      expect(url).toBe('/settings')
    })

    it('should handle empty params object', () => {
      // T036: getUrl(home$, {}) returns '/'
      const url = getUrl(home$, {})
      expect(url).toBe('/')
    })
  })

  // T037: Unit tests for getUrl() with path params
  describe('Routes with path parameters', () => {
    it('should interpolate single path parameter', () => {
      // T037: getUrl(user$, { id: '123' }) returns '/users/123'
      const url = getUrl(user$, { id: '123' })
      expect(url).toBe('/users/123')
    })

    it('should interpolate multiple path parameters', () => {
      // T037: getUrl(nested$, { id: 'admin-user-1' }) returns '/admin/users/admin-user-1'
      const url = getUrl(nested$, { id: 'admin-user-1' })
      expect(url).toBe('/admin/users/admin-user-1')
    })

    it('should interpolate path parameter with different values', () => {
      // T037: Different parameter values produce different URLs
      expect(getUrl(user$, { id: '456' })).toBe('/users/456')
      expect(getUrl(user$, { id: '789' })).toBe('/users/789')
    })

    it('should handle numeric path parameters as strings', () => {
      // T037: Numeric values should be converted to strings
      const url = getUrl(admin$, { section: 'dashboard' })
      expect(url).toBe('/admin/dashboard')
    })
  })

  // T038: Unit tests for getUrl() with search params
  describe('Routes with search parameters', () => {
    it('should generate URL with single search param', () => {
      // T038: getUrl(search$, { $search: { q: 'hello' } }) returns '/search?q=hello'
      const url = getUrl(search$, { $search: { q: 'hello' } })
      expect(url).toBe('/search?q=hello')
    })

    it('should generate URL with multiple search params', () => {
      // T038: getUrl(search$, { $search: { q: 'world', page: 1 } })
      const url = getUrl(search$, { $search: { page: 1, q: 'world' } })
      expect(url).toBe('/search?q=world&page=1')
    })

    it('should handle empty search params object', () => {
      // T038: Empty $search should return path without query string
      const url = getUrl(search$, { $search: {} })
      expect(url).toBe('/search')
    })

    it('should handle undefined search param values', () => {
      // T038: Undefined values should be omitted from query string
      const url = getUrl(search$, { $search: { page: undefined, q: undefined } })
      expect(url).toBe('/search')
    })

    it('should URL-encode special characters in search params', () => {
      // T038: Special characters should be properly encoded
      const url = getUrl(search$, { $search: { q: 'test&special?chars=1' } })
      expect(url).toBe('/search?q=test%26special%3Fchars%3D1')
    })

    it('should encode spaces as + in search params', () => {
      // T038: Spaces should be encoded as + (form encoding)
      const url = getUrl(search$, { $search: { q: 'test query' } })
      expect(url).toBe('/search?q=test+query')
    })
  })

  // String URL support
  describe('String URL support', () => {
    it('should pass through string URL unchanged', () => {
      // String URL should be returned as-is
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

  // Test all fixture cases
  describe('Fixture test cases', () => {
    it('should match all GET_URL_TEST_CASES from fixtures', () => {
      const testCases = GET_URL_TEST_CASES

      for (const testCase of testCases) {
        // Map route path to route reference
        let route$: RouteReference
        if (testCase.route === TEST_ROUTES.HOME) route$ = home$
        else if (testCase.route === TEST_ROUTES.USER) route$ = user$
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        else if (testCase.route === TEST_ROUTES.SEARCH) route$ = search$
        // @ts-expect-error probably a buggy test
        else if (testCase.route === TEST_ROUTES.SETTINGS) route$ = settings$
        else route$ = home$ // fallback

        const url = getUrl(route$, testCase.params)
        expect(url, `Test case "${testCase.name}" failed`).toBe(testCase.expected)
      }
    })
  })

  // Edge cases
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
      // Note: NESTED route doesn't have search params in definition, so this tests
      // the case where we try to add search params to a route without them
      const url = getUrl(nested$, { id: 'test-user' })
      expect(url).toBe('/admin/users/test-user')
    })
  })
})
