import * as React from 'react'
import { ListState } from '../listStateSystem'

export const VirtuosoContext = React.createContext<{ listState: Partial<ListState> } | undefined>(undefined)
