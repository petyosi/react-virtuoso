import type { Engine } from './Engine'
import type { NodeInit, NodeRef } from './types'

import { addNodeInit } from './nodeUtils'

// Types
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

// Global storage for link metadata (similar to nodeInits$$)
const storageLinkMetadata$$ = new Map<symbol, StorageLinkMetadata<unknown>>()

// Per-engine state (WeakMap for automatic cleanup)
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
  // Validate options
  if (!options.key) {
    throw new Error('linkCellToStorage: key is required')
  }

  // Store metadata globally
  storageLinkMetadata$$.set(cell$, { options } as StorageLinkMetadata<unknown>)

  // Register initialization logic
  addNodeInit(
    ((engine: Engine, node$: NodeRef<T>) => {
      // Skip in non-browser environments
      if (typeof window === 'undefined' || !isStorageAvailable(options.storageType)) {
        engine.tracer.log('Storage linking skipped (not in browser environment)')
        return
      }

      // Initialize per-engine state
      if (!engineStorageState$$.has(engine)) {
        engineStorageState$$.set(engine, {
          lastWrittenValues: new Map(),
          listener: null,
          timers: new Map(),
        })
      }

      // biome-ignore lint/style/noNonNullAssertion: we just checked and set the value above
      const state = engineStorageState$$.get(engine)!
      const storageKey = getStorageKey(engine, options)

      // Serialization helpers
      const serialize = options.serialize ?? ((v: T) => JSON.stringify(v))
      const deserialize = options.deserialize ?? ((s: string) => JSON.parse(s) as T)

      try {
        const storedValue = readFromStorage(storageKey, options)
        if (storedValue !== null) {
          const deserialized = deserialize(storedValue)
          engine.pub(node$, deserialized)
          state.lastWrittenValues.set(storageKey, storedValue)
          engine.tracer.log(`Initialized ${options.key} from storage:`, deserialized)
        }
      } catch (error) {
        engine.tracer.log(`Failed to deserialize ${options.key}:`, error)
      }

      // Subscribe to cell changes → write to storage (debounced)
      const debounceMs = options.debounceMs ?? (options.storageType === 'localStorage' ? 500 : 0)

      engine.sub(node$, (value) => {
        // Clear existing timer
        const existingTimer = state.timers.get(storageKey)
        if (existingTimer) {
          clearTimeout(existingTimer)
        }

        // Debounce write
        const timer = setTimeout(() => {
          state.timers.delete(storageKey)

          try {
            const serialized = serialize(value)
            writeToStorage(storageKey, serialized, options)
            state.lastWrittenValues.set(storageKey, serialized)
            engine.tracer.log(`Wrote ${options.key} to storage:`, value)
          } catch (error) {
            engine.tracer.log(`Failed to serialize ${options.key}:`, error)
          }
        }, debounceMs)

        state.timers.set(storageKey, timer)
      })

      // Setup cross-tab sync for localStorage
      if (options.storageType === 'localStorage' && !state.listener) {
        const listener = (event: StorageEvent) => {
          // Only handle events for our storage area
          if (event.storageArea !== window.localStorage) {
            return
          }

          // Check if this is one of our linked cells
          const metadata = storageLinkMetadata$$.get(node$) as StorageLinkMetadata<T> | undefined
          if (!metadata) {
            return
          }

          const ourStorageKey = getStorageKey(engine, metadata.options)
          if (event.key !== ourStorageKey) {
            return
          }

          // Prevent infinite loops: check if value actually changed
          const lastWritten = state.lastWrittenValues.get(ourStorageKey)
          if (event.newValue === lastWritten) {
            return
          }

          // Update cell with new value from storage
          if (event.newValue !== null) {
            try {
              const des = (metadata.options.deserialize ?? ((s: string) => JSON.parse(s))) as (s: string) => T
              const deserialized = des(event.newValue)
              engine.pub(node$, deserialized)
              state.lastWrittenValues.set(ourStorageKey, event.newValue)
              engine.tracer.log(`Cross-tab sync: ${metadata.options.key}`, deserialized)
            } catch (error) {
              engine.tracer.log(`Failed to deserialize cross-tab update for ${metadata.options.key}:`, error)
            }
          }
        }

        window.addEventListener('storage', listener)
        state.listener = listener

        // Register cleanup callback for engine disposal
        engine.onDispose(() => {
          if (state.listener) {
            window.removeEventListener('storage', state.listener)
            state.listener = null
          }
          // Clear all timers
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

// Helper: Get namespaced storage key
function getStorageKey<T>(engine: Engine, options: StorageLinkOptions<T>): string {
  // Cookies are not namespaced (domain-wide)
  if (options.storageType === 'cookie') {
    return options.key
  }

  // Use engine id for namespacing if present
  return engine.id ? `${engine.id}:${options.key}` : options.key
}

// Helper: Check if storage is available
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

// Helper: Read from storage
function readFromStorage<T>(key: string, options: StorageLinkOptions<T>): null | string {
  if (options.storageType === 'cookie') {
    return readCookie(key)
  }

  return window[options.storageType].getItem(key)
}

// Helper: Write to storage
function writeToStorage<T>(key: string, value: string, options: StorageLinkOptions<T>): void {
  if (options.storageType === 'cookie') {
    writeCookie(key, value, options)
  } else {
    window[options.storageType].setItem(key, value)
  }
}

// Helper: Read cookie
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

// Helper: Write cookie
function writeCookie<T>(key: string, value: string, options: StorageLinkOptions<T>): void {
  let cookieString = `${key}=${value}`

  // Apply cookie options if this is a cookie storage type
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

// Helper: Parse expires string (e.g., "7d", "1h", "30m")
function parseExpiresString(expires: string): Date {
  const match = /^(\d+)([dhm])$/.exec(expires)
  if (!match?.[1] || !match[2]) {
    throw new Error(`Invalid expires format: ${expires}. Use format like "7d", "1h", "30m"`)
  }

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
