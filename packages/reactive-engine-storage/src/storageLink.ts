import { addNodeInit } from '@virtuoso.dev/reactive-engine-core'
import invariant from 'tiny-invariant'

import type { Engine, NodeInit, NodeRef, StateRef } from '@virtuoso.dev/reactive-engine-core'

export type StoredValue<T> = { present: false } | { present: true; value: T }

export interface StorageAdapter<T = string> {
  read(key: string): StoredValue<T>
  remove(key: string): void
  subscribe(key: string, listener: (value: StoredValue<T>) => void): () => void
  write(key: string, value: T): void
}

export type StorageRemovalPolicy<T> =
  | { type: 'preserve' }
  | { type: 'reset'; value: T }
  | { resolve: (current: T) => StoredValue<T>; type: 'resolve' }

export type StorageAdapterOperation = 'deserialize' | 'read' | 'removal' | 'serialize' | 'subscribe' | 'write'

export interface StorageAdapterFailure {
  error: unknown
  key: string
  operation: StorageAdapterOperation
}

interface AdapterStorageLinkBase<T, TStored> {
  adapter: StateRef<StorageAdapter<TStored>>
  debounceMs?: number
  key: string
  onError?: (failure: StorageAdapterFailure) => void
  removal?: StorageRemovalPolicy<T>
}

interface StringAdapterCodecs<T> {
  deserialize?: (value: string) => T
  serialize?: (value: T) => string
}

interface CustomAdapterCodecs<T, TStored> {
  deserialize: (value: TStored) => T
  serialize: (value: T) => TStored
}

export type AdapterStorageLinkOptions<T, TStored = string> = AdapterStorageLinkBase<T, TStored> &
  ([TStored] extends [string] ? StringAdapterCodecs<T> : CustomAdapterCodecs<T, TStored>)

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

interface AdapterOperationMarker {
  listenerError?: unknown
  listenerThrew: boolean
}

const adapterOperations$$ = new WeakMap<object, AdapterOperationMarker[]>()

function beginAdapterOperation(adapter: object): AdapterOperationMarker {
  const marker = { listenerThrew: false }
  const operations = adapterOperations$$.get(adapter) ?? []
  operations.push(marker)
  adapterOperations$$.set(adapter, operations)
  return marker
}

function endAdapterOperation(adapter: object, marker: AdapterOperationMarker): void {
  const operations = adapterOperations$$.get(adapter)
  if (operations === undefined) {
    return
  }
  const index = operations.lastIndexOf(marker)
  if (index !== -1) {
    operations.splice(index, 1)
  }
  if (operations.length === 0) {
    adapterOperations$$.delete(adapter)
  }
}

function markAdapterListenerError(adapter: object, error: unknown): void {
  const marker = adapterOperations$$.get(adapter)?.at(-1)
  if (marker !== undefined) {
    marker.listenerError = error
    marker.listenerThrew = true
  }
}

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
export function linkCellToStorage<T>(cell$: NodeRef<T>, options: StorageLinkOptions<T>): void
export function linkCellToStorage<T, TStored = string>(cell$: StateRef<T>, options: AdapterStorageLinkOptions<T, TStored>): void
export function linkCellToStorage<T, TStored>(
  cell$: NodeRef<T>,
  options: AdapterStorageLinkOptions<T, TStored> | StorageLinkOptions<T>
): void {
  invariant(options.key, 'linkCellToStorage: key is required')

  if ('adapter' in options) {
    linkCellToAdapterStorage(cell$ as StateRef<T>, options)
    return
  }

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

function linkCellToAdapterStorage<T, TStored>(cell$: StateRef<T>, options: AdapterStorageLinkOptions<T, TStored>): void {
  const debounceMs = options.debounceMs ?? 0
  invariant(Number.isFinite(debounceMs) && debounceMs >= 0, 'linkCellToStorage: debounceMs must be a non-negative finite number')

  const providedSerialize = options.serialize as ((value: T) => TStored) | undefined
  const providedDeserialize = options.deserialize as ((value: TStored) => T) | undefined
  const serialize: (value: T) => TStored =
    providedSerialize ??
    ((value: T) => {
      const serialized = JSON.stringify(value)
      if (serialized === undefined) {
        throw new Error('linkCellToStorage: JSON serialization returned undefined')
      }
      return serialized as TStored
    })
  const deserialize: (value: TStored) => T = providedDeserialize ?? ((value: TStored) => JSON.parse(value as string) as T)

  addNodeInit(
    ((engine: Engine, node$: StateRef<T>) => {
      let adapter = engine.getValue(options.adapter)
      let adapterUnsubscribe: (() => void) | undefined
      let disposed = false
      const inboundEventFrames: { events: T[]; value: T }[] = []
      let pendingTimer: ReturnType<typeof setTimeout> | undefined
      let writing = false

      const report = (operation: StorageAdapterOperation, error: unknown) => {
        options.onError?.({ error, key: options.key, operation })
      }

      const cancelPendingWrite = () => {
        if (pendingTimer !== undefined) {
          clearTimeout(pendingTimer)
          pendingTimer = undefined
        }
      }

      const write = (value: T) => {
        let stored: TStored
        try {
          stored = serialize(value)
        } catch (error) {
          report('serialize', error)
          return
        }

        const selectedAdapter = adapter
        const marker = beginAdapterOperation(selectedAdapter)
        try {
          writing = true
          selectedAdapter.write(options.key, stored)
        } catch (error) {
          if (marker.listenerThrew && Object.is(error, marker.listenerError)) {
            throw error
          }
          report('write', error)
        } finally {
          writing = false
          endAdapterOperation(selectedAdapter, marker)
        }
      }

      const persistExplicit = (value: T) => {
        if (disposed) {
          return
        }
        cancelPendingWrite()
        if (debounceMs === 0) {
          write(value)
        } else {
          pendingTimer = setTimeout(() => {
            pendingTimer = undefined
            if (!disposed) {
              write(value)
            }
          }, debounceMs)
        }
      }

      const publishInbound = (value: T) => {
        const frame = { events: [] as T[], value }
        inboundEventFrames.push(frame)
        try {
          engine.pub(node$, value)
        } finally {
          inboundEventFrames.pop()
        }

        const inboundIndex = frame.events.findIndex((eventValue) => Object.is(eventValue, frame.value))
        if (inboundIndex !== -1) {
          frame.events.splice(inboundIndex, 1)
        }
        for (const explicitValue of frame.events) {
          persistExplicit(explicitValue)
        }
      }

      const deserializeAndPublish = (stored: TStored) => {
        let value: T
        try {
          value = deserialize(stored)
        } catch (error) {
          report('deserialize', error)
          return
        }
        publishInbound(value)
      }

      const handleRemoval = () => {
        const removal = options.removal
        if (!removal || removal.type === 'preserve') {
          return
        }
        if (removal.type === 'reset') {
          publishInbound(removal.value)
          return
        }
        let resolved: StoredValue<T>
        try {
          resolved = removal.resolve(engine.getValue(node$))
        } catch (error) {
          report('removal', error)
          return
        }
        if (resolved.present) {
          publishInbound(resolved.value)
        }
      }

      const observeStoredValue = (selectedAdapter: StorageAdapter<TStored>, stored: StoredValue<TStored>) => {
        if (disposed || selectedAdapter !== adapter || writing) {
          return
        }
        cancelPendingWrite()
        if (stored.present) {
          deserializeAndPublish(stored.value)
        } else {
          handleRemoval()
        }
      }

      const selectAdapter = (nextAdapter: StorageAdapter<TStored>) => {
        cancelPendingWrite()
        adapterUnsubscribe?.()
        adapter = nextAdapter

        let stored: StoredValue<TStored> | undefined
        try {
          stored = adapter.read(options.key)
        } catch (error) {
          report('read', error)
        }
        if (stored?.present === true) {
          deserializeAndPublish(stored.value)
        }

        const selectedAdapter = adapter
        const marker = beginAdapterOperation(selectedAdapter)
        try {
          adapterUnsubscribe = selectedAdapter.subscribe(options.key, (nextStored) => {
            try {
              observeStoredValue(selectedAdapter, nextStored)
            } catch (error) {
              markAdapterListenerError(selectedAdapter, error)
              throw error
            }
          })
        } catch (error) {
          adapterUnsubscribe = undefined
          if (marker.listenerThrew && Object.is(error, marker.listenerError)) {
            throw error
          }
          report('subscribe', error)
        } finally {
          endAdapterOperation(selectedAdapter, marker)
        }
      }

      selectAdapter(adapter)

      const cellUnsubscribe = engine.sub(node$, (value) => {
        const inboundFrame = inboundEventFrames.at(-1)
        if (inboundFrame !== undefined) {
          inboundFrame.events.push(value)
          return
        }
        persistExplicit(value)
      })
      const selectionUnsubscribe = engine.sub(options.adapter, (nextAdapter) => {
        if (nextAdapter !== adapter) {
          selectAdapter(nextAdapter)
        }
      })

      engine.onDispose(() => {
        disposed = true
        cancelPendingWrite()
        adapterUnsubscribe?.()
        adapterUnsubscribe = undefined
        cellUnsubscribe()
        selectionUnsubscribe()
      })
    }) as NodeInit<unknown>,
    cell$
  )
}

function getStorageKey<T>(engine: Engine, options: StorageLinkOptions<T>): string {
  if (options.storageType === 'cookie') {
    return options.key
  }

  return engine.id === undefined ? options.key : `${engine.id}:${options.key}`
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

    if (path !== undefined) {
      cookieString += `; path=${path}`
    }

    if (domain !== undefined) {
      cookieString += `; domain=${domain}`
    }

    if (expires !== undefined) {
      const expiresDate = typeof expires === 'string' ? parseExpiresString(expires) : expires
      cookieString += `; expires=${expiresDate.toUTCString()}`
    }

    if (secure === true) {
      cookieString += '; secure'
    }

    if (sameSite) {
      cookieString += `; samesite=${sameSite}`
    }
  }

  document.cookie = cookieString
}

function parseExpiresString(expires: string): Date {
  const match = /^(\d+)([dhm])$/.exec(expires)
  invariant(match?.[1] !== undefined && match[2] !== undefined, `Invalid expires format: ${expires}. Use format like "7d", "1h", "30m"`)

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
