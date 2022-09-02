import * as React from 'react'

interface Context {
  viewportHeight: number
  itemHeight: number
}

export const VirtuosoMockContext = React.createContext<Context | undefined>(undefined)
