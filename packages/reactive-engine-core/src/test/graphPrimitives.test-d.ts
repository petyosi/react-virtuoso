import { describe, expectTypeOf, it } from 'vitest'

import { Cell, e, equalArrays, equalBy, equalNullable, Resource, Stream, withResources } from '..'

import type { Comparator, NodeRef } from '..'

describe('graph primitive types', () => {
  it('types comparator helpers', () => {
    interface Item {
      id: number
      label: string
    }

    const byId = equalBy<Item>((value) => value.id)
    const nullableById = equalNullable<Item>((left, right) => left.id === right.id)

    expectTypeOf(byId).toExtend<Comparator<Item>>()
    expectTypeOf(nullableById).toExtend<Comparator<Item | null>>()
    expectTypeOf(equalArrays<Item>)
      .parameter(2)
      .toEqualTypeOf<((left: Item, right: Item) => boolean) | undefined>()

    Cell(
      { id: 1, label: 'first' },
      equalBy((value: Item) => value.id)
    )
  })

  it('infers filterMap retained output', () => {
    const source$ = Stream<number>()
    const result$ = e.pipe(
      source$,
      e.filterMap((value) => (value > 0 ? String(value) : null), false)
    )

    expectTypeOf(result$).toExtend<NodeRef<string>>()
  })

  it('infers a heterogeneous resource tuple', () => {
    const source$ = Stream<{ id: number }>()
    const count$ = Resource(() => 1)
    const label$ = Resource(() => 'ready')

    withResources(source$, [count$, label$] as const, (source, resources) => {
      expectTypeOf(source).toEqualTypeOf<{ id: number }>()
      expectTypeOf(resources).toEqualTypeOf<readonly [number, string]>()
    })
  })
})
