import { Cell, Stream } from '@virtuoso.dev/reactive-engine-core'
import { expectTypeOf, test } from 'vitest'

import { useLinkCellToExternalState } from '..'

test('infers the bridge value from its cell', () => {
  const state$ = Cell({ id: 1 })
  const writeRequested$ = Stream<{ id: number }>()

  useLinkCellToExternalState({
    cell: state$,
    equals: (current, external) => {
      expectTypeOf(current).toEqualTypeOf<{ id: number }>()
      expectTypeOf(external).toEqualTypeOf<{ id: number }>()
      return current.id === external.id
    },
    externalValue: { id: 2 },
    writeExternalValue: (value) => expectTypeOf(value).toEqualTypeOf<{ id: number }>(),
    writeRequested: writeRequested$,
  })
})

test('supports function-valued and undefined state', () => {
  const functionState$ = Cell<() => number>(() => 1)
  const functionRequest$ = Stream<() => number>()
  const externalFunction = () => 2
  useLinkCellToExternalState({
    cell: functionState$,
    externalValue: externalFunction,
    writeExternalValue: (value) => expectTypeOf(value).toEqualTypeOf<() => number>(),
    writeRequested: functionRequest$,
  })

  const undefinedState$ = Cell<undefined>(undefined)
  useLinkCellToExternalState({
    cell: undefinedState$,
    externalValue: undefined,
    writeExternalValue: (value) => expectTypeOf(value).toEqualTypeOf<undefined>(),
    writeRequested: Stream<undefined>(),
  })
})

test('supports different observed value and write request types', () => {
  interface TimeRange {
    since: Date
    until: Date
  }
  interface QueryRangePatch {
    last?: string
    since?: string
    until?: string
  }

  const range$ = Cell<TimeRange>({ since: new Date(0), until: new Date(1) })
  const writeRequested$ = Stream<QueryRangePatch>()

  useLinkCellToExternalState({
    cell: range$,
    equals: (current, external) => {
      expectTypeOf(current).toEqualTypeOf<TimeRange>()
      expectTypeOf(external).toEqualTypeOf<TimeRange>()
      return current.since === external.since && current.until === external.until
    },
    externalValue: { since: new Date(2), until: new Date(3) },
    writeExternalValue: (request) => expectTypeOf(request).toEqualTypeOf<QueryRangePatch>(),
    writeRequested: writeRequested$,
  })
})

test('rejects invalid targets and mismatched channels', () => {
  const state$ = Cell(0)
  const request$ = Stream<number>()

  const useInvalidTarget = () => {
    useLinkCellToExternalState({
      // @ts-expect-error The inbound target must have readable state.
      cell: Stream<number>(),
      externalValue: 0,
      writeExternalValue: () => undefined,
      writeRequested: request$,
    })
  }

  const useInvalidExternal = () => {
    useLinkCellToExternalState({
      cell: state$,
      // @ts-expect-error The external value must match the cell.
      externalValue: 'wrong',
      writeExternalValue: () => undefined,
      writeRequested: request$,
    })
  }

  const useInvalidDefaultRequest = () => {
    useLinkCellToExternalState<number>({
      cell: state$,
      externalValue: 0,
      writeExternalValue: () => undefined,
      // @ts-expect-error An explicit value type defaults the request to the same type.
      writeRequested: Stream<string>(),
    })
  }

  const useInvalidWriter = () => {
    useLinkCellToExternalState({
      cell: state$,
      externalValue: 0,
      // @ts-expect-error The writer value must match the cell.
      writeExternalValue: (value: string) => value,
      writeRequested: request$,
    })
  }

  expectTypeOf(useInvalidTarget).toBeFunction()
  expectTypeOf(useInvalidExternal).toBeFunction()
  expectTypeOf(useInvalidDefaultRequest).toBeFunction()
  expectTypeOf(useInvalidWriter).toBeFunction()
})
