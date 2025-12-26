import { describe, expectTypeOf, it } from 'vitest'

import type { NodeRef } from '../../types'

import { Cell, e } from '../..'

describe('filter operator type narrowing', () => {
  it('narrows type with type predicate', () => {
    const value$ = Cell<null | string>(null)
    const filtered$ = e.pipe(
      value$,
      e.filter((v): v is string => v !== null)
    )

    // Type should be narrowed to string
    expectTypeOf(filtered$).toMatchTypeOf<NodeRef<string>>()
  })

  it('preserves type without type predicate', () => {
    const value$ = Cell<null | string>(null)
    const filtered$ = e.pipe(
      value$,
      e.filter((v) => v !== null)
    )

    // Type should remain string | null
    expectTypeOf(filtered$).toMatchTypeOf<NodeRef<null | string>>()
  })

  it('narrows union types with type predicate', () => {
    const value$ = Cell<null | number | string>(0)
    const filtered$ = e.pipe(
      value$,
      e.filter((v): v is string => typeof v === 'string')
    )

    // Type should be narrowed to string
    expectTypeOf(filtered$).toMatchTypeOf<NodeRef<string>>()
  })

  it('narrows to specific object types', () => {
    interface User {
      name: string
      type: 'user'
    }

    interface Admin {
      name: string
      type: 'admin'
    }

    const value$ = Cell<Admin | User>({ name: 'John', type: 'user' })
    const filtered$ = e.pipe(
      value$,
      e.filter((v): v is Admin => v.type === 'admin')
    )

    // Type should be narrowed to Admin
    expectTypeOf(filtered$).toMatchTypeOf<NodeRef<Admin>>()
  })

  it('works with multiple type predicates in chain', () => {
    const value$ = Cell<null | number | string>(null)
    const filtered$ = e.pipe(
      value$,
      e.filter((v): v is number | string => v !== null),
      e.filter((v): v is string => typeof v === 'string')
    )

    // Type should be narrowed to string
    expectTypeOf(filtered$).toMatchTypeOf<NodeRef<string>>()
  })

  it('preserves original type when boolean predicate is used', () => {
    const value$ = Cell<number>(0)
    const filtered$ = e.pipe(
      value$,
      e.filter((v) => v > 0)
    )

    // Type should remain number
    expectTypeOf(filtered$).toMatchTypeOf<NodeRef<number>>()
  })
})
