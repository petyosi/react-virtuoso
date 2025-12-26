import { Suspense } from 'react'
import { EngineProvider, Router, useCellValue, usePublisher } from '../../src'
import { lists$, tasks$ } from './routes'
import { theme$, toggleTheme$ } from './theme'

function AppContent() {
  const theme = useCellValue(theme$)
  const toggleTheme = usePublisher(toggleTheme$)

  const backgroundColor = theme === 'dark' ? '#000000' : '#ffffff'
  const textColor = theme === 'dark' ? '#ffffff' : '#000000'

  return (
    <div style={{ backgroundColor, color: textColor, minHeight: '100vh' }}>
      <div style={{ padding: '10px', borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#ccc'}` }}>
        <button onClick={() => toggleTheme()} style={{ padding: '8px 16px' }}>
          Toggle Theme ({theme})
        </button>
      </div>
      <Suspense fallback={<div style={{ padding: '20px' }}>Loading...</div>}>
        <Router routes={[lists$, tasks$]} />
      </Suspense>
    </div>
  )
}

export function TodoApp() {
  return (
    <EngineProvider>
      <AppContent />
    </EngineProvider>
  )
}
