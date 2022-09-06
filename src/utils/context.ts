import * as React from 'react'

export interface VirtuosoMockContextValue {
  viewportHeight: number
  itemHeight: number
}

export const VirtuosoMockContext = React.createContext<VirtuosoMockContextValue | undefined>(undefined)
