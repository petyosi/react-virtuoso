import { createContext } from 'react'

export interface VirtuosoMockContextValue {
  viewportHeight: number
  itemHeight: number
}

export const VirtuosoMockContext = createContext<VirtuosoMockContextValue | undefined>(undefined)

export interface VirtuosoGridMockContextValue {
  viewportHeight: number
  viewportWidth: number
  itemHeight: number
  itemWidth: number
}

export const VirtuosoGridMockContext = createContext<VirtuosoGridMockContextValue | undefined>(undefined)
