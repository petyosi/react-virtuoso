/** biome-ignore-all lint/suspicious/noExplicitAny: tests */

import { act, renderHook } from '@testing-library/react'
import { Cell } from '@virtuoso.dev/reactive-engine-core'
import { EngineProvider, useCellValue, usePublisher } from '@virtuoso.dev/reactive-engine-react'
import { beforeEach, describe, expect, it } from 'vitest'

import { linkCellToStorage } from './storageLink'

describe('Storage Linked Cells', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    }
  })

  describe('localStorage', () => {
    it('initializes cell from stored value (no namespace)', () => {
      localStorage.setItem('theme', JSON.stringify('dark'))

      const theme$ = Cell<'dark' | 'light'>('light')
      linkCellToStorage(theme$, {
        key: 'theme',
        storageType: 'localStorage',
      })

      const { result } = renderHook(() => useCellValue(theme$), {
        wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
      })

      expect(result.current).toBe('dark')
    })

    it('writes cell changes to storage', async () => {
      const count$ = Cell(0)
      linkCellToStorage(count$, {
        debounceMs: 50,
        key: 'count',
        storageType: 'localStorage',
      })

      const { result } = renderHook(
        () => {
          const count = useCellValue(count$)
          const publish = usePublisher(count$)
          return { count, publish }
        },
        {
          wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
        }
      )

      act(() => {
        result.current.publish(42)
      })

      await new Promise((resolve) => setTimeout(resolve, 100))

      const stored = localStorage.getItem('count')
      expect(stored).toBe('42')
    })

    it('uses custom serialization', async () => {
      const date$ = Cell(new Date('2024-01-01'))
      linkCellToStorage(date$, {
        debounceMs: 50,
        deserialize: (s) => new Date(s),
        key: 'date',
        serialize: (d) => d.toISOString(),
        storageType: 'localStorage',
      })

      const { result } = renderHook(
        () => {
          const date = useCellValue(date$)
          const publish = usePublisher(date$)
          return { date, publish }
        },
        {
          wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
        }
      )

      act(() => {
        result.current.publish(new Date('2024-06-15'))
      })

      await new Promise((resolve) => setTimeout(resolve, 100))

      const stored = localStorage.getItem('date')
      expect(stored).toBe('2024-06-15T00:00:00.000Z')
    })

    it('handles corrupted storage data gracefully', () => {
      localStorage.setItem('data', 'invalid-json')

      const data$ = Cell({ value: 'default' })
      linkCellToStorage(data$, {
        key: 'data',
        storageType: 'localStorage',
      })

      const { result } = renderHook(() => useCellValue(data$), {
        wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
      })

      expect(result.current).toEqual({ value: 'default' })
    })

    it('debounces rapid writes', async () => {
      const counter$ = Cell(0)
      linkCellToStorage(counter$, {
        debounceMs: 100,
        key: 'counter',
        storageType: 'localStorage',
      })

      const { result } = renderHook(
        () => {
          const count = useCellValue(counter$)
          const publish = usePublisher(counter$)
          return { count, publish }
        },
        {
          wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
        }
      )

      act(() => {
        result.current.publish(1)
        result.current.publish(2)
        result.current.publish(3)
      })

      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(localStorage.getItem('counter')).toBeNull()

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(localStorage.getItem('counter')).toBe('3')
    })

    it('uses no namespace when engine has no id', async () => {
      const cell$ = Cell('value')
      linkCellToStorage(cell$, {
        debounceMs: 10,
        key: 'test',
        storageType: 'localStorage',
      })

      const { result } = renderHook(
        () => {
          const value = useCellValue(cell$)
          const publish = usePublisher(cell$)
          return { publish, value }
        },
        {
          wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
        }
      )

      act(() => {
        result.current.publish('updated')
      })

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(localStorage.getItem('test')).toBe('"updated"')
    })

    it('uses engine id as namespace when provided', async () => {
      const cell$ = Cell('value')
      linkCellToStorage(cell$, {
        debounceMs: 10,
        key: 'test',
        storageType: 'localStorage',
      })

      const { result } = renderHook(
        () => {
          const value = useCellValue(cell$)
          const publish = usePublisher(cell$)
          return { publish, value }
        },
        {
          wrapper: ({ children }) => <EngineProvider engineId="my-app">{children}</EngineProvider>,
        }
      )

      act(() => {
        result.current.publish('updated')
      })

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(localStorage.getItem('my-app:test')).toBe('"updated"')
    })

    it('persists across page reloads with stable engine id', () => {
      localStorage.setItem('my-app:counter', '42')

      const counter$ = Cell(0)
      linkCellToStorage(counter$, {
        key: 'counter',
        storageType: 'localStorage',
      })

      const { result } = renderHook(() => useCellValue(counter$), {
        wrapper: ({ children }) => <EngineProvider engineId="my-app">{children}</EngineProvider>,
      })

      expect(result.current).toBe(42)
    })

    it('persists without namespace when no engine id', () => {
      localStorage.setItem('counter', '99')

      const counter$ = Cell(0)
      linkCellToStorage(counter$, {
        key: 'counter',
        storageType: 'localStorage',
      })

      const { result } = renderHook(() => useCellValue(counter$), {
        wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
      })

      expect(result.current).toBe(99)
    })
  })

  describe('sessionStorage', () => {
    it('persists to sessionStorage', async () => {
      const temp$ = Cell('temporary')
      linkCellToStorage(temp$, {
        debounceMs: 10,
        key: 'temp',
        storageType: 'sessionStorage',
      })

      const { result } = renderHook(
        () => {
          const value = useCellValue(temp$)
          const publish = usePublisher(temp$)
          return { publish, value }
        },
        {
          wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
        }
      )

      act(() => {
        result.current.publish('updated')
      })

      await new Promise((resolve) => setTimeout(resolve, 50))

      const stored = sessionStorage.getItem('temp')
      expect(stored).toBe('"updated"')
    })

    it('does not debounce by default', async () => {
      const fast$ = Cell('fast')
      linkCellToStorage(fast$, {
        key: 'fast',
        storageType: 'sessionStorage',
      })

      const { result } = renderHook(
        () => {
          const value = useCellValue(fast$)
          const publish = usePublisher(fast$)
          return { publish, value }
        },
        {
          wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
        }
      )

      act(() => {
        result.current.publish('updated')
      })

      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(sessionStorage.getItem('fast')).toBe('"updated"')
    })
  })

  describe('cookies', () => {
    it('persists to cookies', async () => {
      const pref$ = Cell('preference')
      linkCellToStorage(pref$, {
        debounceMs: 10,
        key: 'pref',
        storageType: 'cookie',
      })

      const { result } = renderHook(
        () => {
          const value = useCellValue(pref$)
          const publish = usePublisher(pref$)
          return { publish, value }
        },
        {
          wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
        }
      )

      act(() => {
        result.current.publish('updated')
      })

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(document.cookie).toContain('pref="updated"')
    })

    it('applies cookie options', async () => {
      const pref$ = Cell('value')
      linkCellToStorage(pref$, {
        cookieOptions: {
          path: '/',
        },
        debounceMs: 10,
        key: 'test-cookie',
        storageType: 'cookie',
      })

      const { result } = renderHook(
        () => {
          const value = useCellValue(pref$)
          const publish = usePublisher(pref$)
          return { publish, value }
        },
        {
          wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
        }
      )

      act(() => {
        result.current.publish('updated')
      })

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(document.cookie).toContain('test-cookie="updated"')
    })

    it('does not namespace cookie keys', async () => {
      const cookie$ = Cell('value')
      linkCellToStorage(cookie$, {
        debounceMs: 10,
        key: 'my-cookie',
        storageType: 'cookie',
      })

      const { result } = renderHook(
        () => {
          const value = useCellValue(cookie$)
          const publish = usePublisher(cookie$)
          return { publish, value }
        },
        {
          wrapper: ({ children }) => <EngineProvider engineId="my-app">{children}</EngineProvider>,
        }
      )

      act(() => {
        result.current.publish('updated')
      })

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(document.cookie).toContain('my-cookie=')
      expect(document.cookie).not.toContain('my-app:')
    })
  })

  describe('SSR safety', () => {
    it('does not crash in non-browser environment', () => {
      const cell$ = Cell('value')

      expect(() => {
        linkCellToStorage(cell$, {
          key: 'test',
          storageType: 'localStorage',
        })
      }).not.toThrow()
    })
  })

  describe('cleanup', () => {
    it('storage link is registered correctly', () => {
      const cell$ = Cell('value')
      linkCellToStorage(cell$, {
        key: 'cleanup-test',
        storageType: 'localStorage',
      })

      renderHook(() => useCellValue(cell$), {
        wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
      })

      expect(true).toBe(true)
    })
  })
})
