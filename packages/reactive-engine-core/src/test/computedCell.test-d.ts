import { assertType, expectTypeOf, test } from 'vitest'

import { Cell, ComputedCell, DerivedCell, Resource, Stream, Trigger } from '..'

import type { Inp, NodeRef, Out, StateRef } from '..'

test('infers heterogeneous dependency tuples and result values', () => {
  const count$ = Cell(1)
  const label$ = Cell('item')
  const result$ = ComputedCell([count$, label$], ([count, label]) => `${label}:${count}`)

  expectTypeOf(result$).toEqualTypeOf<StateRef<string>>()
})

test('state refs remain assignable to existing node aliases', () => {
  const cell$ = Cell(1)
  const derived$ = DerivedCell(1, cell$)
  const computed$ = ComputedCell([cell$] as const, ([value]) => value)

  assertType<NodeRef<number>>(cell$)
  assertType<Inp<number>>(derived$)
  assertType<Out<number>>(computed$)
})

test('rejects dependencies without the readable-state brand', () => {
  const stream$ = Stream<number>()
  const trigger$ = Trigger()
  const resource$ = Resource(() => 1)
  const plain$ = Symbol('plain') as NodeRef<number>

  const rejectsStream = () =>
    // @ts-expect-error Streams have no synchronously readable current value.
    ComputedCell([stream$] as const, ([value]) => value)
  const rejectsTrigger = () =>
    // @ts-expect-error Triggers have no synchronously readable current value.
    ComputedCell([trigger$] as const, ([value]) => value)
  const rejectsResource = () =>
    // @ts-expect-error Resources use a separate lifecycle and are not StateRef nodes.
    ComputedCell([resource$] as const, ([value]) => value)
  const rejectsPlainNode = () =>
    // @ts-expect-error A plain NodeRef does not prove readable state.
    ComputedCell([plain$] as const, ([value]) => value)

  expectTypeOf(rejectsStream).toBeFunction()
  expectTypeOf(rejectsTrigger).toBeFunction()
  expectTypeOf(rejectsResource).toBeFunction()
  expectTypeOf(rejectsPlainNode).toBeFunction()
})
