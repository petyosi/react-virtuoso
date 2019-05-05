import { createContext } from 'react'
import { VirtuosoStore } from './VirtuosoStore'

export const VirtuosoContext = createContext<ReturnType<typeof VirtuosoStore> | undefined>(undefined)
