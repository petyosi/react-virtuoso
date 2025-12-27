/**
 * Router Test Fixtures
 *
 * Common test routes and components used by both string-based and typed-reference test suites.
 * These fixtures ensure both test suites test identical scenarios for feature parity validation.
 */

import React from 'react'

/**
 * Mock components for testing
 */
export const HomePage = () => React.createElement('div', null, 'Home Page')
export const UserPage = () => React.createElement('div', null, 'User Page')
export const SettingsPage = () => React.createElement('div', null, 'Settings Page')
export const SearchPage = () => React.createElement('div', null, 'Search Page')
export const NotFoundPage = () => React.createElement('div', null, '404 Not Found')
export const LoginPage = () => React.createElement('div', null, 'Login Page')
export const AdminPage = () => React.createElement('div', null, 'Admin Page')

/**
 * Test route paths
 * Used to create both string-based routes and typed route references
 * Using {param} syntax for parameter interpolation
 */
export const TEST_ROUTES = {
  ADMIN: '/admin/{section}',
  HOME: '/',
  LOGIN: '/login',
  NESTED: '/admin/users/{id}',
  NOT_FOUND: '/404',
  SEARCH: '/search?q={q?}&page={page?:number}',
  SETTINGS: '/settings',
  USER: '/users/{id}',
} as const

/**
 * Expected route definitions for typed references
 * These match the TEST_ROUTES but include type information
 *
 * This structure is used to mock route references in tests:
 * - Route paths with :param syntax for path parameters
 * - Search params for query string parameters (optional)
 */
export const TYPED_ROUTE_DEFINITIONS = {
  admin$: {
    params: { section: '' as string },
    path: TEST_ROUTES.ADMIN,
  },
  home$: {
    params: {} as Record<string, never>,
    path: TEST_ROUTES.HOME,
  },
  login$: {
    params: {} as Record<string, never>,
    path: TEST_ROUTES.LOGIN,
  },
  nested$: {
    params: { id: '' as string },
    path: TEST_ROUTES.NESTED,
  },
  notFound$: {
    params: {} as Record<string, never>,
    path: TEST_ROUTES.NOT_FOUND,
  },
  search$: {
    params: {
      $search: {
        page: 0 as number | undefined,
        q: '' as string | undefined,
      },
    },
    path: TEST_ROUTES.SEARCH,
  },
  settings$: {
    params: {} as Record<string, never>,
    path: TEST_ROUTES.SETTINGS,
  },
  user$: {
    params: { id: '' as string },
    path: TEST_ROUTES.USER,
  },
} as const

/**
 * Navigation test cases
 * Shared scenarios tested by both string and typed reference suites
 */
export const NAVIGATION_TEST_CASES = [
  {
    expected: '/',
    name: 'navigate to root path',
    route: TEST_ROUTES.HOME,
  },
  {
    expected: '/users/123',
    name: 'navigate to path with single param',
    params: { id: '123' },
    route: TEST_ROUTES.USER,
  },
  {
    expected: '/admin/users/admin-user-1',
    name: 'navigate to path with multiple params',
    params: { id: 'admin-user-1' },
    route: TEST_ROUTES.NESTED,
  },
  {
    expected: '/search?q=test+query',
    name: 'navigate to path with search params',
    params: { $search: { q: 'test query' } },
    route: TEST_ROUTES.SEARCH,
  },
  {
    expected: '/search?q=test&page=2',
    name: 'navigate to path with search params and pagination',
    params: { $search: { page: 2, q: 'test' } },
    route: TEST_ROUTES.SEARCH,
  },
  {
    expected: '/settings',
    name: 'navigate to path without params',
    route: TEST_ROUTES.SETTINGS,
  },
] as const

/**
 * URL generation test cases
 * Used for getUrl() utility function tests
 */
export const GET_URL_TEST_CASES = [
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
] as const

/**
 * Guard test cases
 * Scenarios for testing guard context methods with route references
 */
export const GUARD_TEST_CASES = [
  {
    action: 'redirect',
    expected: TEST_ROUTES.LOGIN,
    name: 'guard redirect to login',
    route: TEST_ROUTES.LOGIN,
  },
  {
    action: 'redirect',
    expected: '/users/current-user',
    name: 'guard redirect to user profile',
    params: { id: 'current-user' },
    route: TEST_ROUTES.USER,
  },
  {
    action: 'navigate',
    expected: TEST_ROUTES.HOME,
    name: 'guard navigate to home',
    route: TEST_ROUTES.HOME,
  },
  {
    action: 'navigate',
    expected: '/admin/users',
    name: 'guard navigate to admin section',
    params: { section: 'users' },
    route: TEST_ROUTES.ADMIN,
  },
  {
    action: 'continue',
    expected: undefined,
    name: 'guard continue (no action)',
  },
] as const

/**
 * Edge case test scenarios
 */
export const EDGE_CASE_TEST_CASES = [
  {
    expected: '/users/999',
    name: 'route with numeric params',
    params: { id: '999' },
    route: TEST_ROUTES.USER,
  },
  {
    expected: '/search?q=test-value_123',
    name: 'route with special characters in params',
    params: { $search: { q: 'test-value_123' } },
    route: TEST_ROUTES.SEARCH,
  },
  {
    expected: '/search',
    name: 'route with empty search params object',
    params: { $search: {} },
    route: TEST_ROUTES.SEARCH,
  },
  {
    expected: '/search',
    name: 'route with undefined search param values',
    params: { $search: { page: undefined, q: undefined } },
    route: TEST_ROUTES.SEARCH,
  },
] as const

/**
 * Type safety validation test cases
 * These are used to verify TypeScript catches errors at compile time
 */
export const TYPE_SAFETY_TEST_CASES = [
  {
    name: 'should error: missing required path param',
    shouldError: true,
    testCase: 'navigate(user$)', // missing { id: string }
  },
  {
    name: 'should error: wrong param type',
    shouldError: true,
    testCase: 'navigate(user$, { id: 123 })', // id should be string
  },
  {
    name: 'should error: extra unexpected param',
    shouldError: true,
    testCase: 'navigate(user$, { id: "123", extra: "param" })', // extra not allowed
  },
  {
    name: 'should compile: correct typed reference usage',
    shouldError: false,
    testCase: 'navigate(user$, { id: "123" })',
  },
  {
    name: 'should compile: string URL support',
    shouldError: false,
    testCase: 'navigate("/users/123")',
  },
] as const
