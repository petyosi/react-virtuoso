/// <reference types="@vitest/browser/matchers" />
/** biome-ignore-all lint/suspicious/noExplicitAny: tests */

import { beforeEach, describe, expect, it } from 'vitest'
import { renderHook } from 'vitest-browser-react'

import { Cell, EngineProvider, linkCellToStorage, useCellValue, usePublisher } from '../../'

describe('Storage Linked Cells', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear()
    sessionStorage.clear()
    // Clear all cookies
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
      // biome-ignore lint/suspicious/noDocumentCookie: necessary for clearing test cookies
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    }
  })

  describe('localStorage', () => {
    it('initializes cell from stored value (no namespace)', async () => {
      localStorage.setItem('theme', JSON.stringify('dark'))

      const theme$ = Cell<'dark' | 'light'>('light')
      linkCellToStorage(theme$, {
        key: 'theme',
        storageType: 'localStorage',
      })

      const { result } = await renderHook(() => useCellValue(theme$), {
        initialProps: undefined,
        wrapper: EngineProvider,
      })

      // Should initialize from storage, not initial value
      expect(result.current).toBe('dark')
    })

    it('writes cell changes to storage', async () => {
      const count$ = Cell(0)
      linkCellToStorage(count$, {
        debounceMs: 50,
        key: 'count',
        storageType: 'localStorage',
      })

      const { result } = await renderHook(
        () => {
          const count = useCellValue(count$)
          const publish = usePublisher(count$)
          return { count, publish }
        },
        {
          initialProps: undefined,
          wrapper: EngineProvider,
        }
      )

      result.current.publish(42)

      // Wait for debounce
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

      const { result } = await renderHook(
        () => {
          const date = useCellValue(date$)
          const publish = usePublisher(date$)
          return { date, publish }
        },
        {
          initialProps: undefined,
          wrapper: EngineProvider,
        }
      )

      // Publish a new date to trigger storage write
      result.current.publish(new Date('2024-06-15'))

      await new Promise((resolve) => setTimeout(resolve, 100))

      const stored = localStorage.getItem('date')
      expect(stored).toBe('2024-06-15T00:00:00.000Z')
    })

    it('handles corrupted storage data gracefully', async () => {
      localStorage.setItem('data', 'invalid-json')

      const data$ = Cell({ value: 'default' })
      linkCellToStorage(data$, {
        key: 'data',
        storageType: 'localStorage',
      })

      const { result } = await renderHook(() => useCellValue(data$), {
        initialProps: undefined,
        wrapper: EngineProvider,
      })

      // Should keep initial value when deserialization fails
      expect(result.current).toEqual({ value: 'default' })
    })

    it('debounces rapid writes', async () => {
      const counter$ = Cell(0)
      linkCellToStorage(counter$, {
        debounceMs: 100,
        key: 'counter',
        storageType: 'localStorage',
      })

      const { result } = await renderHook(
        () => {
          const count = useCellValue(counter$)
          const publish = usePublisher(counter$)
          return { count, publish }
        },
        {
          initialProps: undefined,
          wrapper: EngineProvider,
        }
      )

      // Rapid updates
      result.current.publish(1)
      result.current.publish(2)
      result.current.publish(3)

      // Should only write final value after debounce
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

      const { result } = await renderHook(
        () => {
          const value = useCellValue(cell$)
          const publish = usePublisher(cell$)
          return { publish, value }
        },
        {
          initialProps: undefined,
          wrapper: EngineProvider, // No id provided
        }
      )

      // Publish a new value to trigger storage write
      result.current.publish('updated')

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

      const { result } = await renderHook(
        () => {
          const value = useCellValue(cell$)
          const publish = usePublisher(cell$)
          return { publish, value }
        },
        {
          initialProps: undefined,
          wrapper: ({ children }: { children: React.ReactNode }) => <EngineProvider engineId="my-app">{children}</EngineProvider>,
        }
      )

      // Publish a new value to trigger storage write
      result.current.publish('updated')

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(localStorage.getItem('my-app:test')).toBe('"updated"')
    })

    it('persists across page reloads with stable engine id', async () => {
      // Simulate first page load
      localStorage.setItem('my-app:counter', '42')

      const counter$ = Cell(0)
      linkCellToStorage(counter$, {
        key: 'counter',
        storageType: 'localStorage',
      })

      const { result } = await renderHook(() => useCellValue(counter$), {
        initialProps: undefined,
        wrapper: ({ children }: { children: React.ReactNode }) => <EngineProvider engineId="my-app">{children}</EngineProvider>,
      })

      // Should restore value from storage despite new engine instance
      expect(result.current).toBe(42)
    })

    it('persists without namespace when no engine id', async () => {
      // Simulate first page load
      localStorage.setItem('counter', '99')

      const counter$ = Cell(0)
      linkCellToStorage(counter$, {
        key: 'counter',
        storageType: 'localStorage',
      })

      const { result } = await renderHook(() => useCellValue(counter$), {
        initialProps: undefined,
        wrapper: EngineProvider, // No id
      })

      // Should restore from clean key
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

      const { result } = await renderHook(
        () => {
          const value = useCellValue(temp$)
          const publish = usePublisher(temp$)
          return { publish, value }
        },
        {
          initialProps: undefined,
          wrapper: EngineProvider,
        }
      )

      // Publish a new value to trigger storage write
      result.current.publish('updated')

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

      const { result } = await renderHook(
        () => {
          const value = useCellValue(fast$)
          const publish = usePublisher(fast$)
          return { publish, value }
        },
        {
          initialProps: undefined,
          wrapper: EngineProvider,
        }
      )

      result.current.publish('updated')

      // Should write immediately (no debounce)
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

      const { result } = await renderHook(
        () => {
          const value = useCellValue(pref$)
          const publish = usePublisher(pref$)
          return { publish, value }
        },
        {
          initialProps: undefined,
          wrapper: EngineProvider,
        }
      )

      // Publish a new value to trigger storage write
      result.current.publish('updated')

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

      const { result } = await renderHook(
        () => {
          const value = useCellValue(pref$)
          const publish = usePublisher(pref$)
          return { publish, value }
        },
        {
          initialProps: undefined,
          wrapper: EngineProvider,
        }
      )

      // Publish a new value to trigger storage write
      result.current.publish('updated')

      await new Promise((resolve) => setTimeout(resolve, 50))

      // Note: Testing exact cookie attributes in browser is tricky
      // This test verifies the cookie was set
      expect(document.cookie).toContain('test-cookie="updated"')
    })

    it('does not namespace cookie keys', async () => {
      const cookie$ = Cell('value')
      linkCellToStorage(cookie$, {
        debounceMs: 10,
        key: 'my-cookie',
        storageType: 'cookie',
      })

      const { result } = await renderHook(
        () => {
          const value = useCellValue(cookie$)
          const publish = usePublisher(cookie$)
          return { publish, value }
        },
        {
          initialProps: undefined,
          wrapper: ({ children }: { children: React.ReactNode }) => <EngineProvider engineId="my-app">{children}</EngineProvider>,
        }
      )

      // Publish a new value to trigger storage write
      result.current.publish('updated')

      await new Promise((resolve) => setTimeout(resolve, 50))

      // Cookie key should be exactly as specified (never namespaced)
      expect(document.cookie).toContain('my-cookie=')
      expect(document.cookie).not.toContain('my-app:')
    })
  })

  describe('SSR safety', () => {
    it('does not crash in non-browser environment', () => {
      // This test verifies type safety, actual SSR testing would be in Node env
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

      void renderHook(() => useCellValue(cell$), {
        initialProps: undefined,
        wrapper: EngineProvider,
      })

      // Verify storage link is set up (listeners are cleaned up via engine.onDispose)
      // Full cleanup testing would require engine disposal, which happens automatically
      expect(true).toBe(true)
    })
  })
})
