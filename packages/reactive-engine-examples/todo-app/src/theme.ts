import { Cell, e, Trigger } from '@virtuoso.dev/reactive-engine-core'
import { linkCellToStorage } from '@virtuoso.dev/reactive-engine-storage'

export type Theme = 'light' | 'dark'

export const theme$ = Cell<Theme>('light')

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
    })
  ),
  theme$
)
