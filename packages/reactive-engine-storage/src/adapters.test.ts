import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createCookieStorageAdapter, createLocalStorageAdapter, createMemoryStorageAdapter, createSessionStorageAdapter } from './adapters'

describe('storage adapters', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0]?.trim()
      if (name !== undefined && name !== '') {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      }
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('stores present undefined and notifies memory listeners synchronously', () => {
    const adapter = createMemoryStorageAdapter<undefined>()
    const records: unknown[] = []
    const unsubscribe = adapter.subscribe('key', (value) => records.push(value))

    expect(adapter.read('key')).toEqual({ present: false })
    adapter.write('key', undefined)
    expect(adapter.read('key')).toEqual({ present: true, value: undefined })
    expect(records).toEqual([{ present: true, value: undefined }])

    adapter.remove('key')
    expect(records).toEqual([{ present: true, value: undefined }, { present: false }])
    unsubscribe()
    unsubscribe()
    adapter.write('key', undefined)
    expect(records).toHaveLength(2)
  })

  it.each([
    ['local', createLocalStorageAdapter, () => localStorage],
    ['session', createSessionStorageAdapter, () => sessionStorage],
  ] as const)('reads, writes, removes, and notifies the %s storage adapter', (_name, createAdapter, getStorage) => {
    const adapter = createAdapter()
    const records: unknown[] = []
    const unsubscribe = adapter.subscribe('key', (value) => records.push(value))

    expect(adapter.read('key')).toEqual({ present: false })
    adapter.write('key', 'value')
    expect(getStorage().getItem('key')).toBe('value')
    expect(adapter.read('key')).toEqual({ present: true, value: 'value' })
    expect(records).toEqual([{ present: true, value: 'value' }])

    adapter.remove('key')
    expect(adapter.read('key')).toEqual({ present: false })
    expect(records).toEqual([{ present: true, value: 'value' }, { present: false }])
    unsubscribe()
  })

  it('forwards native external localStorage events to matching subscribers', () => {
    const adapter = createLocalStorageAdapter()
    const records: unknown[] = []
    const unsubscribe = adapter.subscribe('key', (value) => records.push(value))

    window.dispatchEvent(new StorageEvent('storage', { key: 'other', newValue: 'ignored', storageArea: localStorage }))
    window.dispatchEvent(new StorageEvent('storage', { key: 'key', newValue: 'external', storageArea: localStorage }))
    window.dispatchEvent(new StorageEvent('storage', { key: 'key', newValue: null, storageArea: localStorage }))

    expect(records).toEqual([{ present: true, value: 'external' }, { present: false }])
    unsubscribe()
  })

  it('does not re-read the storage accessor while handling native events', () => {
    const storageArea = window.localStorage
    const adapter = createLocalStorageAdapter()
    const records: unknown[] = []
    const unsubscribe = adapter.subscribe('key', (value) => records.push(value))
    const storageGetter = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked storage')
    })

    window.dispatchEvent(new StorageEvent('storage', { key: 'key', newValue: 'external', storageArea }))

    expect(records).toEqual([{ present: true, value: 'external' }])
    expect(storageGetter).not.toHaveBeenCalled()
    unsubscribe()
  })

  it('reads, writes, removes, and identity-notifies cookies', () => {
    const adapter = createCookieStorageAdapter({ path: '/', sameSite: 'lax' })
    const records: unknown[] = []
    const unsubscribe = adapter.subscribe('key', (value) => records.push(value))

    adapter.write('key', 'value')
    expect(adapter.read('key')).toEqual({ present: true, value: 'value' })
    expect(records).toEqual([{ present: true, value: 'value' }])
    adapter.remove('key')
    expect(adapter.read('key')).toEqual({ present: false })
    expect(records).toEqual([{ present: true, value: 'value' }, { present: false }])
    unsubscribe()
  })

  it('removes cookies when a future expiry is configured', () => {
    const adapter = createCookieStorageAdapter({ expires: '7d', path: '/' })

    adapter.write('expiring', 'value')
    expect(adapter.read('expiring')).toEqual({ present: true, value: 'value' })
    adapter.remove('expiring')
    expect(adapter.read('expiring')).toEqual({ present: false })
  })

  it('formats cookie identity, security, and Date expiry options', () => {
    const expires = new Date('2030-01-02T03:04:05.000Z')
    const cookieSetter = vi.spyOn(document, 'cookie', 'set')
    const adapter = createCookieStorageAdapter({
      domain: 'example.test',
      expires,
      path: '/app',
      sameSite: 'strict',
      secure: true,
    })

    adapter.write('configured', 'value')
    expect(cookieSetter).toHaveBeenLastCalledWith(
      `configured=value; path=/app; domain=example.test; expires=${expires.toUTCString()}; secure; samesite=strict`
    )
    adapter.remove('configured')
    expect(cookieSetter).toHaveBeenLastCalledWith(
      'configured=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/app; domain=example.test; secure; samesite=strict'
    )
  })

  it('rejects invalid cookie expiry shorthand', () => {
    const adapter = createCookieStorageAdapter({ expires: 'next week' })

    expect(() => {
      adapter.write('key', 'value')
    }).toThrow('Invalid expires format: next week. Use format like "7d", "1h", "30m"')
  })

  it('creates browser adapters safely when browser globals are unavailable', () => {
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)

    for (const adapter of [createLocalStorageAdapter(), createSessionStorageAdapter(), createCookieStorageAdapter()]) {
      expect(adapter.read('key')).toEqual({ present: false })
      expect(() => {
        adapter.write('key', 'value')
      }).not.toThrow()
      expect(() => {
        adapter.remove('key')
      }).not.toThrow()
      expect(() => {
        adapter.subscribe('key', () => undefined)()
      }).not.toThrow()
    }
  })
})
