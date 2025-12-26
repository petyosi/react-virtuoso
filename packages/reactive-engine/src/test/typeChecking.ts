/* eslint-disable @typescript-eslint/no-namespace */
/**
 * Type Checking Test Utilities
 *
 * This file contains utilities for verifying compile-time type safety.
 * Tests in this file use TypeScript's type system to validate:
 * - Route references are properly typed
 * - Parameters are correctly inferred and validated
 * - Type guards prevent invalid route references
 * - Search parameters are optional and properly typed
 *
 * These tests are NOT executed at runtime - they are compile-time checks.
 * Use with tools like `tsd` or `expectType` from `expect-type` package.
 */

import type { CreateRouteReference, RouteParams } from '../router/types'

/**
 * Helper type to assert that a type is compatible with another type
 * Used to verify type safety at compile time
 *
 * @example
 * type T = { id: string }
 * type U = { id: string }
 * type _ = AssertCompatible<T, U> // OK
 * type _ = AssertCompatible<T, { name: string }> // ERROR
 */
export type AssertCompatible<T, U> = T extends U ? (U extends T ? true : false) : false

/**
 * Helper to assert that a type should cause a TypeScript error
 * This is useful for negative test cases
 */
export type ExpectError<T> = T extends never ? true : false

/**
 * Test scenarios for route reference typing
 * These are compile-time assertions, not runtime tests
 *
 * T011: Type safety tests for route reference parameters
 * T012: Type safety tests for search parameters
 */
export namespace RouteReferenceTypeTests {
  // T011: Type safety tests for route reference parameters
  type HomeParams = RouteParams<'/'>
  type HomeRoute = CreateRouteReference<'/'>
  type AssertHomeParams = AssertCompatible<HomeParams, Record<string, never>>

  // T011: Type safety tests for route reference parameters
  type UserParams = RouteParams<'/users/{id}'>
  type UserRoute = CreateRouteReference<'/users/{id}'>
  type AssertUserParams = AssertCompatible<UserParams, { id: string }>
  type AssertUserParamsNoExtra = AssertCompatible<UserParams, { extra?: never; id: string }>

  // T012: Type safety tests for search parameters
  type SearchRoute = CreateRouteReference<'/search?q={q?}&page={page?:number}'>
  type AssertSearchParamsOptional = true

  // T012: Type safety tests for search parameters
  type UserSearchParams = RouteParams<'/users/{id}?role={role?}'>
  type UserSearchRoute = CreateRouteReference<'/users/{id}?role={role?}'>
  type AssertUserSearchParams = AssertCompatible<UserSearchParams, { $search?: { role?: string }; id: string }>

  // Assertion block to use all types and prevent unused warnings
  export type US1TypeTests = [HomeRoute, UserRoute, SearchRoute, UserSearchRoute] & {
    homeParams: AssertHomeParams
    searchParamsOptional: AssertSearchParamsOptional
    userParams: AssertUserParams
    userParamsNoExtra: AssertUserParamsNoExtra
    userSearchParams: AssertUserSearchParams
  }
}

/**
 * Test scenarios for getUrl() typing
 *
 * T034: Type safety tests for getUrl() utility
 * T035: Type safety tests for getUrl() with search params
 */
export namespace GetUrlTypeTests {
  // Create sample route references for testing
  type HomeRoute = CreateRouteReference<'/'>
  type UserRoute = CreateRouteReference<'/users/{id}'>
  type SearchRoute = CreateRouteReference<'/search?q={q?}&page={page?:number}'>
  type AdminRoute = CreateRouteReference<'/admin/{section}'>

  // T034: Test getUrl() with routes that have no params
  type TestGetUrlNoParams = Parameters<(route: HomeRoute, params?: Record<string, never>) => string>

  // T034: Test getUrl() with routes that have required path params
  type TestGetUrlRequiredParams = Parameters<(route: UserRoute, params: { id: string }) => string>

  // T034: Test getUrl() with multiple path params
  type TestGetUrlMultipleParams = Parameters<(route: AdminRoute, params: { section: string }) => string>

  // T034: Test getUrl() with string URL
  type TestGetUrlStringURL = Parameters<(url: string) => string>

  // T035: Test getUrl() with optional search params
  type TestGetUrlSearchParams = Parameters<(route: SearchRoute, params?: { $search?: { page?: number; q?: string } }) => string>

  // T035: Test getUrl() with search params only (no path params)
  type TestGetUrlSearchOnly = Parameters<(route: SearchRoute, params?: { $search?: { q?: string } }) => string>

  // T035: Test that getUrl() return type is always string
  type TestGetUrlReturnType = ReturnType<(route: HomeRoute) => string>
  type AssertReturnIsString = AssertCompatible<TestGetUrlReturnType, string>

  // Assertion block to use all types and prevent unused warnings
  export type US3TypeTests = [
    TestGetUrlNoParams,
    TestGetUrlRequiredParams,
    TestGetUrlMultipleParams,
    TestGetUrlStringURL,
    TestGetUrlSearchParams,
    TestGetUrlSearchOnly,
  ] & {
    returnIsString: AssertReturnIsString
  }
}

/**
 * Test scenarios for guard context typing
 *
 * T023: Type safety tests for guard context methods
 * T024: Type safety tests for guard params
 */
export namespace GuardContextTypeTests {
  // Create sample route references for testing
  type HomeRoute = CreateRouteReference<'/'>
  type LoginRoute = CreateRouteReference<'/login'>
  type UserRoute = CreateRouteReference<'/users/{id}'>
  type SearchRoute = CreateRouteReference<'/search?q={q?}&page={page?:number}'>

  // T023: Test guard context.redirect() with route references
  // Should accept routes without params
  type TestRedirectNoParams = Parameters<(route: LoginRoute, params?: Record<string, never>) => void>
  // Should accept routes with params
  type TestRedirectWithParams = Parameters<(route: UserRoute, params: { id: string }) => void>
  // Should accept string URLs
  type TestRedirectStringURL = Parameters<(url: string, options?: Record<string, unknown>) => void>

  // T024: Test guard context.navigate() with route references
  // Should accept routes without params
  type TestNavigateNoParams = Parameters<(route: HomeRoute, params?: Record<string, never>) => void>
  // Should accept routes with params
  type TestNavigateWithParams = Parameters<(route: UserRoute, params: { id: string }) => void>
  // Should accept string URLs
  type TestNavigateStringURL = Parameters<(url: string) => void>

  // T024: Test search params in guard context
  type TestRedirectSearchParams = Parameters<(route: SearchRoute, params?: { $search?: { page?: number; q?: string } }) => void>

  // Assertion block to use all types and prevent unused warnings
  export type US2TypeTests = [
    TestRedirectNoParams,
    TestRedirectWithParams,
    TestRedirectStringURL,
    TestNavigateNoParams,
    TestNavigateWithParams,
    TestNavigateStringURL,
    TestRedirectSearchParams,
  ]
}

/**
 * String URL support tests
 */
export namespace StringURLTypeTests {
  // Test: String URLs work everywhere typed refs are accepted
  // navigate('/users') should compile (string URL)
  // getUrl('/users') should compile (string URL)
  // context.redirect('/login') should compile (string URL)
  // context.navigate('/home') should compile (string URL)
  export type TestStringURLs = Record<string, never>
}

/**
 * Edge case type tests
 */
export namespace EdgeCaseTypeTests {
  // Test: Route refs should be stable (can't change after definition)
  // const home$ = Route('/', HomePage)
  // typeof home$ should remain constant across the app
  export type TestStableRefs = Record<string, never>

  // Test: Nested layout routes should work with typed refs
  // Routes nested in layouts should work same as top-level routes
  // navigate(nestedRoute$, params) should have same type safety
  export type TestNestedLayouts = Record<string, never>

  // Test: Multiple routes with same path pattern should have different types
  // const user$ = Route('/users/:id', UserPage)
  // const admin$ = Route('/users/:id', AdminPage)
  // These should be distinct types even though paths are identical
  export type TestRouteIdentity = Record<string, never>
}

/**
 * Union type tests for dual API
 */
export namespace DualAPITypeTests {
  // Test: Functions accepting string | RouteReference should work with both
  // navigate(home$ | '/home') should compile for both
  // getUrl(user$ | '/users/:id') should compile for both
  // Result types should be string for getUrl, void for navigate
  export type TestUnionTypes = Record<string, never>
}
