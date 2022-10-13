import * as React from 'react'

export interface VirtuosoMockContextValue {
  viewportHeight: number
  itemHeight: number
}

export const VirtuosoMockContext = React.createContext<VirtuosoMockContextValue | undefined>(undefined)

export interface VirtuosoGridMockContextValue {
  viewportHeight: number
  viewportWidth: number
  itemHeight: number
  itemWidth: number
}

export const VirtuosoGridMockContext = React.createContext<VirtuosoGridMockContextValue | undefined>(undefined)
