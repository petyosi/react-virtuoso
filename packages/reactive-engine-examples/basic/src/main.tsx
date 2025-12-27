import { StrictMode } from 'react'
import './index.css'

import { createRoot } from 'react-dom/client'
import { BasicRouter } from './App'

// biome-ignore lint/style/noNonNullAssertion: trust me, we have root element
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BasicRouter />
  </StrictMode>
)
