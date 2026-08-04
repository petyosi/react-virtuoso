import type { CookieOptions, StorageAdapter, StoredValue } from './storageLink'

type Listener<T> = (value: StoredValue<T>) => void

function notify<T>(listeners: Map<string, Set<Listener<T>>>, key: string, value: StoredValue<T>): void {
  for (const listener of listeners.get(key) ?? []) {
    listener(value)
  }
}

/** Creates an identity-scoped synchronous in-memory adapter. */
export function createMemoryStorageAdapter<T = string>(initialEntries: Iterable<readonly [string, T]> = []): StorageAdapter<T> {
  const values = new Map<string, T>(initialEntries)
  const listeners = new Map<string, Set<Listener<T>>>()

  return {
    read(key) {
      return values.has(key) ? { present: true, value: values.get(key)! } : { present: false }
    },
    remove(key) {
      values.delete(key)
      notify(listeners, key, { present: false })
    },
    subscribe(key, listener) {
      let keyListeners = listeners.get(key)
      if (!keyListeners) {
        keyListeners = new Set()
        listeners.set(key, keyListeners)
      }
      keyListeners.add(listener)
      let active = true
      return () => {
        if (!active) {
          return
        }
        active = false
        keyListeners.delete(listener)
        if (keyListeners.size === 0) {
          listeners.delete(key)
        }
      }
    },
    write(key, value) {
      values.set(key, value)
      notify(listeners, key, { present: true, value })
    },
  }
}

function createWebStorageAdapter(getStorage: () => Storage | undefined): StorageAdapter {
  const listeners = new Map<string, Set<Listener<string>>>()

  return {
    read(key) {
      const storage = getStorage()
      if (!storage) {
        return { present: false }
      }
      const value = storage.getItem(key)
      return value === null ? { present: false } : { present: true, value }
    },
    remove(key) {
      getStorage()?.removeItem(key)
      notify(listeners, key, { present: false })
    },
    subscribe(key, listener) {
      const storageArea = typeof window === 'undefined' ? undefined : getStorage()
      let keyListeners = listeners.get(key)
      if (!keyListeners) {
        keyListeners = new Set()
        listeners.set(key, keyListeners)
      }
      keyListeners.add(listener)

      const storageListener = (event: StorageEvent) => {
        if (event.key !== key || event.storageArea !== storageArea) {
          return
        }
        listener(event.newValue === null ? { present: false } : { present: true, value: event.newValue })
      }
      if (storageArea !== undefined) {
        window.addEventListener('storage', storageListener)
      }

      let active = true
      return () => {
        if (!active) {
          return
        }
        active = false
        keyListeners.delete(listener)
        if (keyListeners.size === 0) {
          listeners.delete(key)
        }
        if (storageArea !== undefined) {
          window.removeEventListener('storage', storageListener)
        }
      }
    },
    write(key, value) {
      getStorage()?.setItem(key, value)
      notify(listeners, key, { present: true, value })
    },
  }
}

/** Creates an SSR-safe adapter over `window.localStorage`. */
export function createLocalStorageAdapter(): StorageAdapter {
  return createWebStorageAdapter(() => (typeof window === 'undefined' ? undefined : window.localStorage))
}

/** Creates an SSR-safe adapter over `window.sessionStorage`. */
export function createSessionStorageAdapter(): StorageAdapter {
  return createWebStorageAdapter(() => (typeof window === 'undefined' ? undefined : window.sessionStorage))
}

function readCookieValue(key: string): StoredValue<string> {
  if (typeof document === 'undefined') {
    return { present: false }
  }
  for (const cookie of document.cookie.split('; ')) {
    const [cookieKey, ...valueParts] = cookie.split('=')
    if (cookieKey === key) {
      return { present: true, value: valueParts.join('=') }
    }
  }
  return { present: false }
}

function cookieSuffix(options: CookieOptions, includeExpires = true): string {
  let suffix = ''
  if (options.path !== undefined) {
    suffix += `; path=${options.path}`
  }
  if (options.domain !== undefined) {
    suffix += `; domain=${options.domain}`
  }
  if (includeExpires && options.expires !== undefined) {
    const expires = typeof options.expires === 'string' ? parseExpiresString(options.expires) : options.expires
    suffix += `; expires=${expires.toUTCString()}`
  }
  if (options.secure === true) {
    suffix += '; secure'
  }
  if (options.sameSite) {
    suffix += `; samesite=${options.sameSite}`
  }
  return suffix
}

function parseExpiresString(expires: string): Date {
  const match = /^(\d+)([dhm])$/.exec(expires)
  if (match?.[1] === undefined || match[2] === undefined) {
    throw new Error(`Invalid expires format: ${expires}. Use format like "7d", "1h", "30m"`)
  }
  const value = Number.parseInt(match[1], 10)
  const result = new Date()
  if (match[2] === 'd') {
    result.setDate(result.getDate() + value)
  }
  if (match[2] === 'h') {
    result.setHours(result.getHours() + value)
  }
  if (match[2] === 'm') {
    result.setMinutes(result.getMinutes() + value)
  }
  return result
}

/** Creates an SSR-safe identity-scoped cookie adapter. */
export function createCookieStorageAdapter(options: CookieOptions = {}): StorageAdapter {
  const listeners = new Map<string, Set<Listener<string>>>()
  return {
    read: readCookieValue,
    remove(key) {
      if (typeof document !== 'undefined') {
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${cookieSuffix(options, false)}`
      }
      notify(listeners, key, { present: false })
    },
    subscribe(key, listener) {
      let keyListeners = listeners.get(key)
      if (!keyListeners) {
        keyListeners = new Set()
        listeners.set(key, keyListeners)
      }
      keyListeners.add(listener)
      let active = true
      return () => {
        if (!active) {
          return
        }
        active = false
        keyListeners.delete(listener)
        if (keyListeners.size === 0) {
          listeners.delete(key)
        }
      }
    },
    write(key, value) {
      if (typeof document !== 'undefined') {
        document.cookie = `${key}=${value}${cookieSuffix(options)}`
      }
      notify(listeners, key, { present: true, value })
    },
  }
}
