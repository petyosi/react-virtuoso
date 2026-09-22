import { assertType, expectTypeOf, test } from 'vitest'

import { Cell, ComputedCell, DerivedCell, Pulsar, Resource, Stream, Trigger } from '..'

import type { NodeRef, Out } from '..'

test('accepts readable number-or-null state and returns valueless output', () => {
  const cadence$ = Cell<number | null>(100)
  const derivedCadence$ = DerivedCell<number | null>(null, cadence$)
  const computedCadence$ = ComputedCell([cadence$], ([cadence]) => cadence)

  expectTypeOf(Pulsar(cadence$)).toEqualTypeOf<Out<void>>()
  assertType<Out<void>>(Pulsar(derivedCadence$))
  assertType<NodeRef<void>>(Pulsar(computedCadence$, { leading: true }))
})

test('rejects non-state and non-cadence inputs', () => {
  const stream$ = Stream<number | null>()
  const trigger$ = Trigger()
  const resource$ = Resource(() => 100)
  const stringCell$ = Cell('100')

  const rejectsStream = () =>
    // @ts-expect-error Streams have no synchronously readable current value.
    Pulsar(stream$)
  const rejectsTrigger = () =>
    // @ts-expect-error Triggers are not readable cadence state.
    Pulsar(trigger$)
  const rejectsResource = () =>
    // @ts-expect-error Resources use a separate lifecycle and are not cadence state.
    Pulsar(resource$)
  const rejectsWrongValue = () =>
    // @ts-expect-error Cadence state must contain number or null.
    Pulsar(stringCell$)

  expectTypeOf(rejectsStream).toBeFunction()
  expectTypeOf(rejectsTrigger).toBeFunction()
  expectTypeOf(rejectsResource).toBeFunction()
  expectTypeOf(rejectsWrongValue).toBeFunction()
})
