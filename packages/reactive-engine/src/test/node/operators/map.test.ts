import { beforeEach, describe, expect, it } from 'vitest'

import { e, Engine, Stream } from '../../..'
import { createSpyWithHistory, testErrors } from '../../testUtils'

describe('map operator', () => {
  let eng!: Engine

  beforeEach(() => {
    eng = new Engine()
  })

  // Basic functionality
  it('transforms values with mapping function', () => {
    const source = Stream<number>()
    const mapped = e.pipe(
      source,
      e.map((x: number) => x * 2)
    )
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(mapped, spy)

    eng.pub(source, 5)
    expect(history).toEqual([10])

    eng.pub(source, 3)
    expect(history).toEqual([10, 6])
  })

  it('maintains proper typing with diffent input/output types', () => {
    const source = Stream<number>()
    const mapped = e.pipe(
      source,
      e.map((x: number) => x.toString())
    )
    const { history, spy } = createSpyWithHistory<string>()

    e.sub(mapped, spy)

    eng.pub(source, 42)
    expect(history).toEqual(['42'])

    eng.pub(source, 0)
    expect(history).toEqual(['42', '0'])
  })

  // Error handling - fail-fast approach
  it('throws when map function throws errors', () => {
    const source = Stream<number>()
    const mapped = e.pipe(
      source,
      e.map((x: number) => {
        if (x < 0) throw testErrors.simple
        return x * 2
      })
    )
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(mapped, spy)

    eng.pub(source, 5)
    expect(history).toEqual([10])

    // Error should crash the engine operation
    expect(() => {
      eng.pub(source, -1)
    }).toThrow(testErrors.simple)
  })

  it('stops processing when map function throws', () => {
    const source = Stream<number>()
    const other = Stream<string>()

    const mapped = e.pipe(
      source,
      e.map((x: number) => {
        if (x === 999) throw testErrors.simple
        return x
      })
    )

    const { spy: mappedSpy } = createSpyWithHistory<number>()
    const { history: otherHistory, spy: otherSpy } = createSpyWithHistory<string>()

    e.sub(mapped, mappedSpy)
    e.sub(other, otherSpy)

    // This should throw and stop processing
    expect(() => {
      eng.pub(source, 999) // This throws
    }).toThrow(testErrors.simple)

    expect(otherHistory).toEqual([]) // Other stream doesn't get processed due to error

    // After error, engine should still work for new operations
    eng.pub(other, 'test')
    expect(otherHistory).toEqual(['test'])
  })

  // Complex objects
  it('transforms complex objects correctly', () => {
    const source = Stream<{ id: number; name: string }>()
    const mapped = e.pipe(
      source,
      e.map((obj) => ({
        ...obj,
        displayName: `User: ${obj.name}`,
        isActive: true,
      }))
    )

    const { history, spy } = createSpyWithHistory()
    e.sub(mapped, spy)

    eng.pub(source, { id: 1, name: 'Alice' })

    expect(history[0]).toEqual({
      displayName: 'User: Alice',
      id: 1,
      isActive: true,
      name: 'Alice',
    })
  })

  // Null/undefined handling
  it('handles null and undefined values', () => {
    const source = Stream<null | number | undefined>()
    const mapped = e.pipe(
      source,
      e.map((x) => (x === null ? 'null' : x === undefined ? 'undefined' : x.toString()))
    )
    const { history, spy } = createSpyWithHistory<string>()

    e.sub(mapped, spy)

    eng.pub(source, null)
    eng.pub(source, undefined)
    eng.pub(source, 42)

    expect(history).toEqual(['null', 'undefined', '42'])
  })

  it('prerves null/undefined when transformation returns them', () => {
    const source = Stream<string>()
    const mapped = e.pipe(
      source,
      e.map((x) => (x === 'null' ? null : x === 'undefined' ? undefined : x))
    )
    const { history, spy } = createSpyWithHistory<null | string | undefined>()

    e.sub(mapped, spy)

    eng.pub(source, 'null')
    eng.pub(source, 'undefined')
    eng.pub(source, 'test')

    expect(history).toEqual([null, undefined, 'test'])
  })

  // Multiple subscribers
  it('works correctly with multiple subscribers', () => {
    const source = Stream<number>()
    const mapped = e.pipe(
      source,
      e.map((x) => x * 2)
    )
    const spy1 = createSpyWithHistory<number>()
    const spy2 = createSpyWithHistory<number>()

    e.sub(mapped, spy1.spy)
    e.sub(mapped, spy2.spy)

    eng.pub(source, 5)

    expect(spy1.history).toEqual([10])
    expect(spy2.history).toEqual([10])
  })

  // Function rerences and closures
  it('handles function rerences correctly', () => {
    const multiplier = 3
    const transform = (x: number) => x * multiplier

    const source = Stream<number>()
    const mapped = e.pipe(source, e.map(transform))
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(mapped, spy)

    eng.pub(source, 4)
    expect(history).toEqual([12])
  })

  it('handles arrow functions and regular functions', () => {
    const source1 = Stream<number>()
    const source2 = Stream<number>()

    const mapped1 = e.pipe(
      source1,
      e.map((x: number) => x + 1)
    ) // Arrow function
    const mapped2 = e.pipe(
      source2,
      e.map((x: number) => x + 2)
    ) // Regular function

    const spy1 = createSpyWithHistory<number>()
    const spy2 = createSpyWithHistory<number>()

    e.sub(mapped1, spy1.spy)
    e.sub(mapped2, spy2.spy)

    eng.pub(source1, 10)
    eng.pub(source2, 10)

    expect(spy1.history).toEqual([11])
    expect(spy2.history).toEqual([12])
  })

  // Edge cases with various data types
  it('handles arrays correctly', () => {
    const source = Stream<number[]>()
    const mapped = e.pipe(
      source,
      e.map((arr) => arr.map((x) => x * 2))
    )
    const { history, spy } = createSpyWithHistory<number[]>()

    e.sub(mapped, spy)

    eng.pub(source, [1, 2, 3])
    expect(history[0]).toEqual([2, 4, 6])
  })

  it('handles boolean transformations', () => {
    const source = Stream<number>()
    const mapped = e.pipe(
      source,
      e.map((x) => x > 5)
    )
    const { history, spy } = createSpyWithHistory<boolean>()

    e.sub(mapped, spy)

    eng.pub(source, 3)
    eng.pub(source, 7)
    eng.pub(source, 5)

    expect(history).toEqual([false, true, false])
  })

  it('handles Date object transformations', () => {
    const source = Stream<Date>()
    const mapped = e.pipe(
      source,
      e.map((date) => date.getTime())
    )
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(mapped, spy)

    const testDate = new Date('2023-01-01')
    eng.pub(source, testDate)

    expect(history[0]).toBe(testDate.getTime())
  })
})
