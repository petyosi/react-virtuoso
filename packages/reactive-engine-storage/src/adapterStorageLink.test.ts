import { Cell, Engine, sub } from '@virtuoso.dev/reactive-engine-core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createMemoryStorageAdapter, linkCellToStorage } from '.'

import type { StorageAdapter, StoredValue } from '.'

interface RecordingAdapter<T> extends StorageAdapter<T> {
  emit(value: StoredValue<T>): void
  readCalls: number
  subscribeCalls: number
  unsubscribeCalls: number
  writes: { key: string; value: T }[]
}

function createRecordingAdapter<T>(initial?: StoredValue<T>): RecordingAdapter<T> {
  let stored = initial ?? ({ present: false } as const)
  const listeners = new Set<(value: StoredValue<T>) => void>()
  return {
    emit(value) {
      stored = value
      for (const listener of listeners) {
        listener(value)
      }
    },
    read() {
      this.readCalls++
      return stored
    },
    readCalls: 0,
    remove() {
      this.emit({ present: false })
    },
    subscribe(_key, listener) {
      this.subscribeCalls++
      listeners.add(listener)
      let active = true
      return () => {
        if (!active) {
          return
        }
        active = false
        this.unsubscribeCalls++
        listeners.delete(listener)
      }
    },
    subscribeCalls: 0,
    unsubscribeCalls: 0,
    write(key, value) {
      this.writes.push({ key, value })
      this.emit({ present: true, value })
    },
    writes: [],
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('adapter-backed storage links', () => {
  it('reads an empty adapter without changing or populating the cell', () => {
    const adapter = createRecordingAdapter<string>()
    const adapter$ = Cell<StorageAdapter>(adapter)
    const value$ = Cell(3)
    linkCellToStorage(value$, { adapter: adapter$, key: 'value' })

    const engine = new Engine()
    expect(engine.getValue(value$)).toBe(3)
    expect(adapter.readCalls).toBe(1)
    expect(adapter.subscribeCalls).toBe(1)
    expect(adapter.writes).toEqual([])
  })

  it('overlays a populated adapter once without writing it back', () => {
    const adapter = createRecordingAdapter<string>({ present: true, value: '42' })
    const adapter$ = Cell<StorageAdapter>(adapter)
    const value$ = Cell(3)
    linkCellToStorage(value$, { adapter: adapter$, key: 'value' })

    const engine = new Engine()
    expect(engine.getValue(value$)).toBe(42)
    expect(adapter.readCalls).toBe(1)
    expect(adapter.writes).toEqual([])
  })

  it('distinguishes a present undefined stored value from absence', () => {
    const adapter = createRecordingAdapter<undefined>({ present: true, value: undefined })
    const adapter$ = Cell<StorageAdapter<undefined>>(adapter)
    const value$ = Cell('default')
    linkCellToStorage(value$, {
      adapter: adapter$,
      deserialize: () => 'present undefined',
      key: 'value',
      serialize: () => undefined,
    })

    const engine = new Engine()
    expect(engine.getValue(value$)).toBe('present undefined')
    expect(adapter.writes).toEqual([])
  })

  it('reports malformed stored data and preserves initialized state', () => {
    const adapter = createRecordingAdapter<string>({ present: true, value: 'invalid' })
    const adapter$ = Cell<StorageAdapter>(adapter)
    const value$ = Cell({ valid: true })
    const failures: string[] = []
    linkCellToStorage(value$, {
      adapter: adapter$,
      key: 'value',
      onError: (failure) => failures.push(failure.operation),
    })

    const engine = new Engine()
    expect(engine.getValue(value$)).toEqual({ valid: true })
    expect(failures).toEqual(['deserialize'])
    expect(adapter.writes).toEqual([])
  })

  it('does not reclassify a throwing error handler or inbound publication', () => {
    const malformed = createRecordingAdapter<string>({ present: true, value: 'invalid' })
    const malformedAdapter$ = Cell<StorageAdapter>(malformed)
    const malformedValue$ = Cell({ valid: true })
    const malformedFailures: string[] = []
    linkCellToStorage(malformedValue$, {
      adapter: malformedAdapter$,
      key: 'malformed',
      onError: (failure) => {
        malformedFailures.push(failure.operation)
        throw new Error('error handler')
      },
    })

    expect(() => new Engine().getValue(malformedValue$)).toThrow('error handler')
    expect(malformedFailures).toEqual(['deserialize'])

    const adapter = createRecordingAdapter<string>()
    const adapter$ = Cell<StorageAdapter>(adapter)
    const value$ = Cell(0)
    const failures: string[] = []
    linkCellToStorage(value$, {
      adapter: adapter$,
      key: 'value',
      onError: (failure) => failures.push(failure.operation),
    })
    const engine = new Engine()
    engine.getValue(value$)
    engine.sub(value$, () => {
      throw new Error('cell subscriber')
    })

    expect(() => {
      adapter.emit({ present: true, value: '1' })
    }).toThrow('cell subscriber')
    expect(failures).toEqual([])
  })

  it('propagates immediate subscription listener errors without reclassifying them', () => {
    const adapter = createRecordingAdapter<string>()
    adapter.subscribe = (_key, listener) => {
      listener({ present: true, value: '1' })
      return () => undefined
    }
    const adapter$ = Cell<StorageAdapter>(adapter)
    const value$ = Cell(0)
    const failures: string[] = []
    sub(value$, () => {
      throw new Error('cell subscriber')
    })
    linkCellToStorage(value$, {
      adapter: adapter$,
      key: 'value',
      onError: (failure) => failures.push(failure.operation),
    })

    expect(() => new Engine().getValue(value$)).toThrow('cell subscriber')
    expect(failures).toEqual([])
  })

  it('propagates another engine listener error through a shared adapter write', () => {
    const adapter = createMemoryStorageAdapter()
    const adapter$ = Cell<StorageAdapter>(adapter)
    const value$ = Cell(0)
    const failures: string[] = []
    linkCellToStorage(value$, {
      adapter: adapter$,
      key: 'value',
      onError: (failure) => failures.push(failure.operation),
    })
    const first = new Engine()
    const second = new Engine()
    first.getValue(value$)
    second.getValue(value$)
    second.sub(value$, () => {
      throw new Error('second engine subscriber')
    })

    expect(() => {
      first.pub(value$, 1)
    }).toThrow('second engine subscriber')
    expect(failures).toEqual([])
  })

  it('does not reclassify removal publication errors', () => {
    const adapter = createRecordingAdapter<string>()
    const adapter$ = Cell<StorageAdapter>(adapter)
    const value$ = Cell(0)
    const failures: string[] = []
    linkCellToStorage(value$, {
      adapter: adapter$,
      key: 'value',
      onError: (failure) => failures.push(failure.operation),
      removal: { resolve: () => ({ present: true, value: 1 }), type: 'resolve' },
    })
    const engine = new Engine()
    engine.getValue(value$)
    engine.sub(value$, () => {
      throw new Error('cell subscriber')
    })

    expect(() => {
      adapter.remove('value')
    }).toThrow('cell subscriber')
    expect(failures).toEqual([])
  })

  it('writes explicit cell changes once and keeps own and external notifications write-silent', () => {
    const adapter = createRecordingAdapter<string>()
    const adapter$ = Cell<StorageAdapter>(adapter)
    const value$ = Cell(0)
    linkCellToStorage(value$, {
      adapter: adapter$,
      deserialize: (value) => Number(value.slice('stored:'.length)) + 1000,
      key: 'value',
      serialize: (value) => `stored:${value}`,
    })

    const engine = new Engine()
    engine.getValue(value$)
    engine.pub(value$, 1)
    expect(adapter.writes).toEqual([{ key: 'value', value: 'stored:1' }])
    expect(engine.getValue(value$)).toBe(1)

    adapter.emit({ present: true, value: 'stored:2' })
    expect(engine.getValue(value$)).toBe(1002)
    expect(adapter.writes).toHaveLength(1)
  })

  it('writes an explicit re-entrant cell change made during inbound notification', () => {
    const adapter = createRecordingAdapter<string>()
    const adapter$ = Cell<StorageAdapter>(adapter)
    const value$ = Cell(0)
    linkCellToStorage(value$, { adapter: adapter$, key: 'value' })

    const engine = new Engine()
    engine.getValue(value$)
    engine.sub(value$, (value) => {
      if (value === 1) {
        engine.pub(value$, 2)
      }
    })

    adapter.emit({ present: true, value: '1' })
    expect(engine.getValue(value$)).toBe(2)
    expect(adapter.writes).toEqual([{ key: 'value', value: '2' }])
  })

  it('tracks re-entrant explicit changes independently of declaration order', () => {
    const adapter = createRecordingAdapter<string>()
    const adapter$ = Cell<StorageAdapter>(adapter)
    const value$ = Cell(0)
    sub(value$, (value, engine) => {
      if (value === 1) {
        engine.pub(value$, 2)
      }
    })
    linkCellToStorage(value$, { adapter: adapter$, key: 'value' })

    const engine = new Engine()
    engine.getValue(value$)
    adapter.emit({ present: true, value: '1' })

    expect(engine.getValue(value$)).toBe(2)
    expect(adapter.writes).toEqual([{ key: 'value', value: '2' }])
  })

  it('debounces to the latest explicit value and cancels pending work on inbound data', () => {
    vi.useFakeTimers()
    const adapter = createRecordingAdapter<string>()
    const adapter$ = Cell<StorageAdapter>(adapter)
    const value$ = Cell(0)
    linkCellToStorage(value$, { adapter: adapter$, debounceMs: 50, key: 'value' })

    const engine = new Engine()
    engine.getValue(value$)
    engine.pub(value$, 1)
    engine.pub(value$, 2)
    vi.advanceTimersByTime(49)
    expect(adapter.writes).toEqual([])
    vi.advanceTimersByTime(1)
    expect(adapter.writes).toEqual([{ key: 'value', value: '2' }])

    engine.pub(value$, 3)
    adapter.emit({ present: true, value: '4' })
    vi.advanceTimersByTime(50)
    expect(engine.getValue(value$)).toBe(4)
    expect(adapter.writes).toHaveLength(1)
  })

  it('cancels old work and preserves the cell when replacement storage is empty', () => {
    vi.useFakeTimers()
    const first = createRecordingAdapter<string>()
    const second = createRecordingAdapter<string>()
    const adapter$ = Cell<StorageAdapter>(first)
    const value$ = Cell(0)
    linkCellToStorage(value$, { adapter: adapter$, debounceMs: 50, key: 'value' })

    const engine = new Engine()
    engine.getValue(value$)
    engine.pub(value$, 1)
    engine.pub(adapter$, second)
    vi.advanceTimersByTime(50)

    expect(first.unsubscribeCalls).toBe(1)
    expect(first.writes).toEqual([])
    expect(second.readCalls).toBe(1)
    expect(second.writes).toEqual([])
    expect(engine.getValue(value$)).toBe(1)

    engine.pub(value$, 2)
    vi.advanceTimersByTime(50)
    expect(second.writes).toEqual([{ key: 'value', value: '2' }])
  })

  it('adopts populated replacement storage without echoing it', () => {
    const first = createRecordingAdapter<string>()
    const second = createRecordingAdapter<string>({ present: true, value: '9' })
    const adapter$ = Cell<StorageAdapter>(first)
    const value$ = Cell(0)
    linkCellToStorage(value$, { adapter: adapter$, key: 'value' })

    const engine = new Engine()
    engine.getValue(value$)
    engine.pub(adapter$, second)
    expect(engine.getValue(value$)).toBe(9)
    expect(first.unsubscribeCalls).toBe(1)
    expect(second.writes).toEqual([])
  })

  it('shares by memory adapter identity and isolates distinct instances', () => {
    const shared = createMemoryStorageAdapter()
    const isolated = createMemoryStorageAdapter()
    const adapter$ = Cell<StorageAdapter>(shared)
    const value$ = Cell(0)
    linkCellToStorage(value$, { adapter: adapter$, key: 'value' })
    const writeSpy = vi.spyOn(shared, 'write')

    const first = new Engine()
    const second = new Engine()
    const third = new Engine({ [adapter$]: isolated })
    first.getValue(value$)
    second.getValue(value$)
    third.getValue(value$)

    first.pub(value$, 5)
    expect(writeSpy).toHaveBeenCalledOnce()
    expect(second.getValue(value$)).toBe(5)
    expect(third.getValue(value$)).toBe(0)
  })

  it.each([
    ['preserve', { type: 'preserve' } as const, 5],
    ['reset', { type: 'reset', value: 0 } as const, 0],
    ['resolve', { resolve: () => ({ present: true, value: 7 }) as const, type: 'resolve' } as const, 7],
  ])('applies the %s removal policy without writing back', (_name, removal, expected) => {
    const adapter = createRecordingAdapter<string>()
    const adapter$ = Cell<StorageAdapter>(adapter)
    const value$ = Cell(5)
    linkCellToStorage(value$, { adapter: adapter$, key: 'value', removal })

    const engine = new Engine()
    engine.getValue(value$)
    adapter.remove('value')
    expect(engine.getValue(value$)).toBe(expected)
    expect(adapter.writes).toEqual([])
  })

  it('reports adapter failures without corrupting state', () => {
    const failures: string[] = []
    const adapter = createRecordingAdapter<string>()
    adapter.read = () => {
      throw new Error('read')
    }
    adapter.subscribe = () => {
      throw new Error('subscribe')
    }
    adapter.write = () => {
      throw new Error('write')
    }
    const adapter$ = Cell<StorageAdapter>(adapter)
    const value$ = Cell(1)
    linkCellToStorage(value$, {
      adapter: adapter$,
      key: 'value',
      onError: (failure) => failures.push(failure.operation),
      serialize: () => {
        throw new Error('serialize')
      },
    })

    const engine = new Engine()
    engine.getValue(value$)
    engine.pub(value$, 2)
    expect(engine.getValue(value$)).toBe(2)
    expect(failures).toEqual(['read', 'subscribe', 'serialize'])

    const writeAdapter = createRecordingAdapter<string>()
    writeAdapter.write = () => {
      throw new Error('write')
    }
    const writeAdapter$ = Cell<StorageAdapter>(writeAdapter)
    const writeValue$ = Cell(1)
    linkCellToStorage(writeValue$, {
      adapter: writeAdapter$,
      key: 'write',
      onError: (failure) => failures.push(failure.operation),
    })
    const writeEngine = new Engine()
    writeEngine.getValue(writeValue$)
    writeEngine.pub(writeValue$, 2)
    expect(writeEngine.getValue(writeValue$)).toBe(2)
    expect(failures).toContain('write')

    const removalAdapter = createRecordingAdapter<string>()
    const removalAdapter$ = Cell<StorageAdapter>(removalAdapter)
    const removalValue$ = Cell(1)
    linkCellToStorage(removalValue$, {
      adapter: removalAdapter$,
      key: 'removal',
      onError: (failure) => failures.push(failure.operation),
      removal: {
        resolve: () => {
          throw new Error('removal')
        },
        type: 'resolve',
      },
    })
    const removalEngine = new Engine()
    removalEngine.getValue(removalValue$)
    removalAdapter.remove('removal')
    expect(failures).toContain('removal')
  })

  it('reports when default JSON serialization returns undefined', () => {
    const failures: string[] = []
    const adapter = createRecordingAdapter<string>()
    const adapter$ = Cell<StorageAdapter>(adapter)
    const value$ = Cell<number | undefined>(1)
    linkCellToStorage(value$, {
      adapter: adapter$,
      key: 'value',
      onError: (failure) => failures.push(failure.operation),
    })
    const engine = new Engine()
    engine.getValue(value$)

    engine.pub(value$, undefined)

    expect(adapter.writes).toEqual([])
    expect(failures).toEqual(['serialize'])
  })

  it('cancels debounce and unsubscribes the selected adapter on disposal', () => {
    vi.useFakeTimers()
    const adapter = createRecordingAdapter<string>()
    const adapter$ = Cell<StorageAdapter>(adapter)
    const value$ = Cell(0)
    linkCellToStorage(value$, { adapter: adapter$, debounceMs: 50, key: 'value' })

    const engine = new Engine()
    engine.getValue(value$)
    engine.pub(value$, 1)
    engine.dispose()
    vi.advanceTimersByTime(50)
    expect(adapter.writes).toEqual([])
    expect(adapter.unsubscribeCalls).toBe(1)
  })

  it('rejects invalid debounce values at declaration time', () => {
    const adapter$ = Cell<StorageAdapter>(createMemoryStorageAdapter())
    expect(() => {
      linkCellToStorage(Cell(0), { adapter: adapter$, debounceMs: -1, key: 'value' })
    }).toThrow('debounceMs must be a non-negative finite number')
  })
})
