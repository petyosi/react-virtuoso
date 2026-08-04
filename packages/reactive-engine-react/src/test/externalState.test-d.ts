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

  const useInvalidRequest = () => {
    useLinkCellToExternalState({
      cell: state$,
      externalValue: 0,
      writeExternalValue: () => undefined,
      // @ts-expect-error The request value must match the cell.
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
  expectTypeOf(useInvalidRequest).toBeFunction()
  expectTypeOf(useInvalidWriter).toBeFunction()
})
