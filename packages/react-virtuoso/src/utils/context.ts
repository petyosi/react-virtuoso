import React from 'react'

/**
 * Mock context value for testing Virtuoso components.
 * Provides fixed dimensions to bypass DOM measurements.
 *
 * @group Virtuoso
 */
export interface VirtuosoMockContextValue {
  /** Fixed height for each item in pixels */
  itemHeight: number
  /** Fixed viewport height in pixels */
  viewportHeight: number
}

/**
 * React context for mocking Virtuoso component measurements in tests.
 * Wrap your Virtuoso component with this provider to bypass DOM measurements.
 *
 * @example
 * ```tsx
 * import { VirtuosoMockContext } from 'react-virtuoso'
 *
 * <VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 30 }}>
 *   <Virtuoso totalCount={100} />
 * </VirtuosoMockContext.Provider>
 * ```
 *
 * @group Virtuoso
 */
export const VirtuosoMockContext = React.createContext<undefined | VirtuosoMockContextValue>(undefined)

/**
 * Mock context value for testing VirtuosoGrid components.
 * Provides fixed dimensions to bypass DOM measurements.
 *
 * @group VirtuosoGrid
 */
export interface VirtuosoGridMockContextValue {
  /** Fixed height for each grid item in pixels */
  itemHeight: number
  /** Fixed width for each grid item in pixels */
  itemWidth: number
  /** Fixed viewport height in pixels */
  viewportHeight: number
  /** Fixed viewport width in pixels */
  viewportWidth: number
}

/**
 * React context for mocking VirtuosoGrid component measurements in tests.
 * Wrap your VirtuosoGrid component with this provider to bypass DOM measurements.
 *
 * @example
 * ```tsx
 * import { VirtuosoGridMockContext } from 'react-virtuoso'
 *
 * <VirtuosoGridMockContext.Provider
 *   value={{ viewportHeight: 300, viewportWidth: 400, itemHeight: 100, itemWidth: 100 }}
 * >
 *   <VirtuosoGrid totalCount={100} />
 * </VirtuosoGridMockContext.Provider>
 * ```
 *
 * @group VirtuosoGrid
 */
export const VirtuosoGridMockContext = React.createContext<undefined | VirtuosoGridMockContextValue>(undefined)
