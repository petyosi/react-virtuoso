import React from 'react'

import type { GlobalProvider } from '@ladle/react'
import '../src/styles.css'
import '../src/_stories/shadcn.css'

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
