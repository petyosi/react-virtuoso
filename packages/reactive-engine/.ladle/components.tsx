import type { GlobalProvider } from '@ladle/react'

import { StrictMode } from 'react'

export const Provider: GlobalProvider = ({ children }) => <StrictMode>{children}</StrictMode>
