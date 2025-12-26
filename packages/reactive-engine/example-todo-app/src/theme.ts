import { Cell, e, linkCellToStorage, Trigger } from '../../src'

export type Theme = 'light' | 'dark'

// Create theme cell with default value 'light'
export const theme$ = Cell<Theme>('light')

// Link to localStorage for persistence
linkCellToStorage(theme$, {
  storageType: 'localStorage',
  key: 'todo-app-theme',
  debounceMs: 100,
})

export const toggleTheme$ = Trigger()

e.link(
  e.pipe(
    toggleTheme$,
    e.withLatestFrom(theme$),
    e.map(([, currentTheme]) => {
      console.log('Toggling theme from', currentTheme)
      return currentTheme === 'light' ? 'dark' : 'light'
    }),
  ),
  theme$,
)
