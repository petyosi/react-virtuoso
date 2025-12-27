import type { Engine, NodeInit, NodeRef } from '@virtuoso.dev/reactive-engine-core'

import { addNodeInit } from '@virtuoso.dev/reactive-engine-core'
import invariant from 'tiny-invariant'

export interface CookieOptions {
  domain?: string
  expires?: Date | string
  path?: string
  sameSite?: 'lax' | 'none' | 'strict'
  secure?: boolean
}

interface BaseStorageLinkOptions<T> {
  debounceMs?: number
  deserialize?: (value: string) => T
  key: string
  serialize?: (value: T) => string
}

interface LocalStorageOptions<T> extends BaseStorageLinkOptions<T> {
  storageType: 'localStorage'
}

interface SessionStorageOptions<T> extends BaseStorageLinkOptions<T> {
  storageType: 'sessionStorage'
}

interface CookieStorageOptions<T> extends BaseStorageLinkOptions<T> {
  cookieOptions?: CookieOptions
  storageType: 'cookie'
}

export type StorageLinkOptions<T> = CookieStorageOptions<T> | LocalStorageOptions<T> | SessionStorageOptions<T>

interface StorageLinkMetadata<T> {
  options: StorageLinkOptions<T>
}

const storageLinkMetadata$$ = new Map<symbol, StorageLinkMetadata<unknown>>()

interface EngineStorageState {
  lastWrittenValues: Map<string, string>
  listener: ((event: StorageEvent) => void) | null
  timers: Map<string, ReturnType<typeof setTimeout>>
}
const engineStorageState$$ = new WeakMap<Engine, EngineStorageState>()

/**
 * Links a cell to browser storage for automatic persistence and synchronization.
 *
 * @example
 * ```typescript
 * // localStorage with no namespace (clean keys)
 * const theme$ = Cell<'light' | 'dark'>('light')
 * linkCellToStorage(theme$, {
 *   storageType: 'localStorage',
 *   key: 'app-theme',
 *   debounceMs: 300 // optional
 * })
 *
 * // With Engine id for namespacing
 * const engine = new Engine({}, 'my-app')
 * // Stored as: 'my-app:app-theme'
 *
 * // Cookies with options
 * linkCellToStorage(prefCell$, {
 *   storageType: 'cookie',
 *   key: 'user-pref',
 *   cookieOptions: {
 *     expires: '7d',
 *     path: '/',
 *     sameSite: 'strict'
 *   }
 * })
 * ```
 */
export function linkCellToStorage<T>(cell$: NodeRef<T>, options: StorageLinkOptions<T>): void {
  invariant(options.key, 'linkCellToStorage: key is required')

  storageLinkMetadata$$.set(cell$, { options } as StorageLinkMetadata<unknown>)

  addNodeInit(
    ((engine: Engine, node$: NodeRef<T>) => {
      if (typeof window === 'undefined' || !isStorageAvailable(options.storageType)) {
        return
      }

      if (!engineStorageState$$.has(engine)) {
        engineStorageState$$.set(engine, {
          lastWrittenValues: new Map(),
          listener: null,
          timers: new Map(),
        })
      }

      const state = engineStorageState$$.get(engine)
      invariant(state, 'engineStorageState$$ must have value for engine')
      const storageKey = getStorageKey(engine, options)

      const serialize = options.serialize ?? ((v: T) => JSON.stringify(v))
      const deserialize = options.deserialize ?? ((s: string) => JSON.parse(s) as T)

      try {
        const storedValue = readFromStorage(storageKey, options)
        if (storedValue !== null) {
          const deserialized = deserialize(storedValue)
          engine.pub(node$, deserialized)
          state.lastWrittenValues.set(storageKey, storedValue)
        }
      } catch (_error) {
        // Failed to deserialize
      }

      const debounceMs = options.debounceMs ?? (options.storageType === 'localStorage' ? 500 : 0)

      engine.sub(node$, (value) => {
        const existingTimer = state.timers.get(storageKey)
        if (existingTimer) {
          clearTimeout(existingTimer)
        }

        const timer = setTimeout(() => {
          state.timers.delete(storageKey)

          try {
            const serialized = serialize(value)
            writeToStorage(storageKey, serialized, options)
            state.lastWrittenValues.set(storageKey, serialized)
          } catch (_error) {
            // Failed to serialize
          }
        }, debounceMs)

        state.timers.set(storageKey, timer)
      })

      if (options.storageType === 'localStorage' && !state.listener) {
        const listener = (event: StorageEvent) => {
          if (event.storageArea !== window.localStorage) {
            return
          }

          const metadata = storageLinkMetadata$$.get(node$) as StorageLinkMetadata<T> | undefined
          if (!metadata) {
            return
          }

          const ourStorageKey = getStorageKey(engine, metadata.options)
          if (event.key !== ourStorageKey) {
            return
          }

          const lastWritten = state.lastWrittenValues.get(ourStorageKey)
          if (event.newValue === lastWritten) {
            return
          }

          if (event.newValue !== null) {
            try {
              const des = (metadata.options.deserialize ?? ((s: string) => JSON.parse(s) as unknown)) as (s: string) => T
              const deserialized = des(event.newValue)
              engine.pub(node$, deserialized)
              state.lastWrittenValues.set(ourStorageKey, event.newValue)
            } catch (_error) {
              // Failed to deserialize cross-tab update
            }
          }
        }

        window.addEventListener('storage', listener)
        state.listener = listener

        engine.onDispose(() => {
          if (state.listener) {
            window.removeEventListener('storage', state.listener)
            state.listener = null
          }
          for (const timer of state.timers.values()) {
            clearTimeout(timer)
          }
          state.timers.clear()
        })
      }
    }) as NodeInit<unknown>,
    cell$
  )
}

function getStorageKey<T>(engine: Engine, options: StorageLinkOptions<T>): string {
  if (options.storageType === 'cookie') {
    return options.key
  }

  return engine.id ? `${engine.id}:${options.key}` : options.key
}

function isStorageAvailable(type: 'cookie' | 'localStorage' | 'sessionStorage'): boolean {
  if (type === 'cookie') {
    return typeof document !== 'undefined' && typeof document.cookie === 'string'
  }

  try {
    const storage = window[type]
    const testKey = '__storage_test__'
    storage.setItem(testKey, 'test')
    storage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

function readFromStorage<T>(key: string, options: StorageLinkOptions<T>): null | string {
  if (options.storageType === 'cookie') {
    return readCookie(key)
  }

  return window[options.storageType].getItem(key)
}

function writeToStorage<T>(key: string, value: string, options: StorageLinkOptions<T>): void {
  if (options.storageType === 'cookie') {
    writeCookie(key, value, options)
  } else {
    window[options.storageType].setItem(key, value)
  }
}

function readCookie(key: string): null | string {
  const cookies = document.cookie.split('; ')
  for (const cookie of cookies) {
    const [cookieKey, ...valueParts] = cookie.split('=')
    if (cookieKey === key) {
      return valueParts.join('=')
    }
  }
  return null
}

function writeCookie<T>(key: string, value: string, options: StorageLinkOptions<T>): void {
  let cookieString = `${key}=${value}`

  if (options.storageType === 'cookie' && options.cookieOptions) {
    const { domain, expires, path, sameSite, secure } = options.cookieOptions

    if (path) {
      cookieString += `; path=${path}`
    }

    if (domain) {
      cookieString += `; domain=${domain}`
    }

    if (expires) {
      const expiresDate = typeof expires === 'string' ? parseExpiresString(expires) : expires
      cookieString += `; expires=${expiresDate.toUTCString()}`
    }

    if (secure) {
      cookieString += '; secure'
    }

    if (sameSite) {
      cookieString += `; samesite=${sameSite}`
    }
  }

  // biome-ignore lint/suspicious/noDocumentCookie: necessary for cookie manipulation
  document.cookie = cookieString
}

function parseExpiresString(expires: string): Date {
  const match = /^(\d+)([dhm])$/.exec(expires)
  invariant(match?.[1] && match[2], `Invalid expires format: ${expires}. Use format like "7d", "1h", "30m"`)

  const amount = match[1]
  const unit = match[2]
  const now = new Date()
  const value = Number.parseInt(amount, 10)

  switch (unit) {
    case 'd':
      now.setDate(now.getDate() + value)
      break
    case 'h':
      now.setHours(now.getHours() + value)
      break
    case 'm':
      now.setMinutes(now.getMinutes() + value)
      break
  }

  return now
}
