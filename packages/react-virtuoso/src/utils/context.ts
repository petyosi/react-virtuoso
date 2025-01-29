import React from 'react'

export interface VirtuosoMockContextValue {
  itemHeight: number
  viewportHeight: number
}

export const VirtuosoMockContext = React.createContext<undefined | VirtuosoMockContextValue>(undefined)

export interface VirtuosoGridMockContextValue {
  itemHeight: number
  itemWidth: number
  viewportHeight: number
  viewportWidth: number
}

export const VirtuosoGridMockContext = React.createContext<undefined | VirtuosoGridMockContextValue>(undefined)
