import React from 'react'

import type { GlobalProvider } from '@ladle/react'

export const Provider: GlobalProvider = ({ children }) => (
  <React.StrictMode>
    <style>{`
.test-instructions {
  color: blue;
}
    `}</style>
    {children}
  </React.StrictMode>
)
