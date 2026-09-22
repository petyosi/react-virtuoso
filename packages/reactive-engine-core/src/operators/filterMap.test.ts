import { describe, expect, it, vi } from 'vitest'

import { e, Engine, Stream } from '../index'
import { createSpyWithHistory, testErrors } from '../testUtils'

describe('filterMap operator', () => {
  it('drops nullish projections and retains other values', () => {
    const source$ = Stream<number>(false)
    const result$ = e.pipe(
      source$,
      e.filterMap((value) => (value > 0 ? value * 2 : null), false)
    )
    const { history, spy } = createSpyWithHistory<number>()
    e.sub(result$, spy)

    const engine = new Engine()
    engine.pub(source$, -1)
    engine.pub(source$, 1)
    engine.pub(source$, 0)
    engine.pub(source$, 2)

    expect(history).toEqual([2, 4])
  })

  it('applies distinctness only to retained values', () => {
    const source$ = Stream<null | number>(false)
    const distinct$ = e.pipe(
      source$,
      e.filterMap((value) => value)
    )
    const nonDistinct$ = e.pipe(
      source$,
      e.filterMap((value) => value, false)
    )
    const distinct = createSpyWithHistory<number>()
    const nonDistinct = createSpyWithHistory<number>()
    e.sub(distinct$, distinct.spy)
    e.sub(nonDistinct$, nonDistinct.spy)

    const engine = new Engine()
    engine.pub(source$, 1)
    engine.pub(source$, null)
    engine.pub(source$, 1)

    expect(distinct.history).toEqual([1])
    expect(nonDistinct.history).toEqual([1, 1])
  })

  it('supports a custom retained-value comparator', () => {
    const source$ = Stream<number>(false)
    const equalParity = vi.fn((previous: number | undefined, current: number) =>
      previous === undefined ? false : previous % 2 === current % 2
    )
    const result$ = e.pipe(
      source$,
      e.filterMap((value) => value, equalParity)
    )
    const { history, spy } = createSpyWithHistory<number>()
    e.sub(result$, spy)

    const engine = new Engine()
    engine.pub(source$, 1)
    expect(equalParity).not.toHaveBeenCalled()
    engine.pub(source$, 3)
    engine.pub(source$, 2)

    expect(history).toEqual([1, 2])
    expect(equalParity.mock.calls.every(([previous]) => previous === 1)).toBe(true)
  })

  it('propagates projection errors', () => {
    const source$ = Stream<number>(false)
    const result$ = e.pipe(
      source$,
      e.filterMap((value) => {
        if (value < 0) {
          throw testErrors.simple
        }
        return value
      })
    )
    e.sub(result$, () => undefined)

    const engine = new Engine()
    expect(() => {
      engine.pub(source$, -1)
    }).toThrow(testErrors.simple)
  })
})
