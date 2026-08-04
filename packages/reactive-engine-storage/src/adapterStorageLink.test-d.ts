import { Cell, Stream } from '@virtuoso.dev/reactive-engine-core'
import { expectTypeOf, test } from 'vitest'

import { createMemoryStorageAdapter, linkCellToStorage } from '.'

import type { StorageAdapter, StoredValue } from '.'

test('infers string adapter codecs from the cell', () => {
  const adapter$ = Cell<StorageAdapter>(createMemoryStorageAdapter())
  const value$ = Cell({ id: 1 })

  linkCellToStorage(value$, {
    adapter: adapter$,
    deserialize: (stored) => {
      expectTypeOf(stored).toEqualTypeOf<string>()
      return { id: Number(stored) }
    },
    key: 'value',
    serialize: (value) => {
      expectTypeOf(value).toEqualTypeOf<{ id: number }>()
      return String(value.id)
    },
  })
})

test('requires codecs for non-string stored values', () => {
  const adapter$ = Cell<StorageAdapter<number>>(createMemoryStorageAdapter<number>())
  const value$ = Cell({ id: 1 })

  linkCellToStorage(value$, {
    adapter: adapter$,
    deserialize: (stored) => ({ id: stored }),
    key: 'value',
    serialize: (value) => value.id,
  })

  const useMissingCodecs = () => {
    // @ts-expect-error Non-string adapters require both codecs.
    linkCellToStorage(value$, { adapter: adapter$, key: 'value' })
  }
  expectTypeOf(useMissingCodecs).toBeFunction()
})

test('treats union-valued adapter codecs as one stored type', () => {
  const adapter$ = Cell<StorageAdapter<number | string>>(createMemoryStorageAdapter<number | string>())
  const value$ = Cell({ id: 1 })

  linkCellToStorage(value$, {
    adapter: adapter$,
    deserialize: (stored) => ({ id: typeof stored === 'number' ? stored : Number(stored) }),
    key: 'value',
    serialize: (value): number | string => value.id,
  })

  const useMissingCodecs = () => {
    // @ts-expect-error A partly non-string adapter requires both codecs.
    linkCellToStorage(value$, { adapter: adapter$, key: 'value' })
  }
  expectTypeOf(useMissingCodecs).toBeFunction()
})

test('requires a StateRef adapter and cell with compatible channels', () => {
  const adapter$ = Cell<StorageAdapter>(createMemoryStorageAdapter())
  const value$ = Cell(0)

  const useStreamTarget = () => {
    // @ts-expect-error Adapter-backed links require readable state targets.
    linkCellToStorage(Stream<number>(), { adapter: adapter$, key: 'value' })
  }
  const useStreamAdapter = () => {
    // @ts-expect-error Adapter selection must be readable state.
    linkCellToStorage(value$, { adapter: Stream<StorageAdapter>(), key: 'value' })
  }

  expectTypeOf(useStreamTarget).toBeFunction()
  expectTypeOf(useStreamAdapter).toBeFunction()
})

test('narrows absence and preserves present undefined', () => {
  const inspect = (stored: StoredValue<undefined>) => {
    if (stored.present) {
      expectTypeOf(stored.value).toEqualTypeOf<undefined>()
    } else {
      // @ts-expect-error Absent storage has no value.
      expectTypeOf(stored.value).toBeNever()
    }
  }
  expectTypeOf(inspect).toBeFunction()
})
