import { beforeEach, describe, expect, it } from 'vitest'

import { e, Engine, Stream } from '../../..'
import { createSpyWithHistory, testErrors } from '../../testUtils'

describe('filter operator', () => {
  let eng!: Engine

  beforeEach(() => {
    eng = new Engine()
  })

  // Basic functionality
  it('filters values based on predicate', () => {
    const source = Stream<number>()
    const filtered = e.pipe(
      source,
      e.filter((x: number) => x > 5)
    )
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(filtered, spy)

    eng.pub(source, 3)
    eng.pub(source, 7)
    eng.pub(source, 2)
    eng.pub(source, 8)

    expect(history).toEqual([7, 8])
  })

  // Error handling - fail-fast approach
  it('throws when predicate function throws errors', () => {
    const source = Stream<number>()
    const filtered = e.pipe(
      source,
      e.filter((x: number) => {
        if (x === 999) throw testErrors.simple
        return x > 5
      })
    )
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(filtered, spy)

    eng.pub(source, 7) // Should pass
    expect(history).toEqual([7])

    // Error should crash the engine operation
    expect(() => {
      eng.pub(source, 999)
    }).toThrow(testErrors.simple)
  })

  it('stops processing when predicate throws', () => {
    const source = Stream<number>()
    const other = Stream<string>()

    const filtered = e.pipe(
      source,
      e.filter((x: number) => {
        if (x === 0) throw testErrors.simple
        return true
      })
    )

    const { history: filteredHistory, spy: filteredSpy } = createSpyWithHistory<number>()
    const { history: otherHistory, spy: otherSpy } = createSpyWithHistory<string>()

    e.sub(filtered, filteredSpy)
    e.sub(other, otherSpy)

    eng.pub(source, 1)
    expect(filteredHistory).toEqual([1])

    // This should throw and stop processing
    expect(() => {
      eng.pub(source, 0) // Throws in predicate
    }).toThrow(testErrors.simple)

    expect(filteredHistory).toEqual([1]) // No new emission due to error
    expect(otherHistory).toEqual([]) // Other stream doesn't get processed due to error

    // After error, engine should still work for new operations
    eng.pub(other, 'test')
    expect(otherHistory).toEqual(['test'])
  })

  // Multiple subscribers
  it('works correctly with multiple subscribers', () => {
    const source = Stream<number>()
    const filtered = e.pipe(
      source,
      e.filter((x) => x % 2 === 0)
    )
    const spy1 = createSpyWithHistory<number>()
    const spy2 = createSpyWithHistory<number>()

    e.sub(filtered, spy1.spy)
    e.sub(filtered, spy2.spy)

    eng.pub(source, 1)
    eng.pub(source, 2)
    eng.pub(source, 3)
    eng.pub(source, 4)

    expect(spy1.history).toEqual([2, 4])
    expect(spy2.history).toEqual([2, 4])
  })

  // Edge cases with special values
  it('handles Infinity and NaN correctly', () => {
    const source = Stream<number>()
    const filtered = e.pipe(
      source,
      e.filter((x) => !isNaN(x) && isFinite(x))
    )
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(filtered, spy)

    eng.pub(source, 1)
    eng.pub(source, Infinity)
    eng.pub(source, -Infinity)
    eng.pub(source, NaN)
    eng.pub(source, 2)

    expect(history).toEqual([1, 2])
  })

  it('handles empty strings and whitespace', () => {
    const source = Stream<string>()
    const filtered = e.pipe(
      source,
      e.filter((s) => s.trim().length > 0)
    )
    const { history, spy } = createSpyWithHistory<string>()

    e.sub(filtered, spy)

    eng.pub(source, 'hello')
    eng.pub(source, '')
    eng.pub(source, '   ')
    eng.pub(source, '\n\t')
    eng.pub(source, 'world')

    expect(history).toEqual(['hello', 'world'])
  })
})
