import React from 'react'

/**
 * The value expected by the {@link VirtuosoDataTableTestingContext}. Useful for testing components that use VirtuosoDataTable.
 *
 * @group Testing
 */
export interface VirtuosoDataTableTestingContextValue {
  /**
   * The simulated viewport height in pixels.
   */
  viewportHeight: number
  /**
   * The simulated item height in pixels.
   */
  itemHeight: number
}

/**
 * A React context that provides a controlled testing environment for VirtuosoDataTable.
 * When this context is provided, the component skips the ResizeObserver measurements and uses the values from the context instead.
 *
 * @group Testing
 */
export const VirtuosoDataTableTestingContext = React.createContext<VirtuosoDataTableTestingContextValue | undefined>(undefined)
