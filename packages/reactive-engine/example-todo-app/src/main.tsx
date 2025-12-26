import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TodoApp } from './App'

// biome-ignore lint/style/noNonNullAssertion: trust me, we have root element
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TodoApp />
  </StrictMode>,
)
