import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { e, Engine, Stream } from '../index'
import { createSpyWithHistory } from '../testUtils'

describe('debounceTime operator', () => {
  let eng!: Engine

  beforeEach(() => {
    eng = new Engine()
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Basic functionality
  it('debounces emissions to specified delay', () => {
    const source = Stream<number>()
    const debounced = e.pipe(source, e.debounceTime(100))
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(debounced, spy)

    // Rapid emissions
    eng.pub(source, 1)
    eng.pub(source, 2)
    eng.pub(source, 3)

    // No emissions yet
    expect(history).toEqual([])

    // Fast-forward time
    vi.advanceTimersByTime(100)

    // Should emit last value
    expect(history).toEqual([3])
  })

  it('resets timer on each new emission', () => {
    const source = Stream<number>()
    const debounced = e.pipe(source, e.debounceTime(100))
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(debounced, spy)

    eng.pub(source, 1)

    // Advance partially
    vi.advanceTimersByTime(50)
    expect(history).toEqual([])

    // New emission resets timer
    eng.pub(source, 2)

    // Advance same amount - should not emit yet
    vi.advanceTimersByTime(50)
    expect(history).toEqual([])

    // Complete the new timer
    vi.advanceTimersByTime(50)
    expect(history).toEqual([2])
  })

  it('emits latest value after debounce period', () => {
    const source = Stream<string>()
    const debounced = e.pipe(source, e.debounceTime(50))
    const { history, spy } = createSpyWithHistory<string>()

    e.sub(debounced, spy)

    eng.pub(source, 'a')
    eng.pub(source, 'b')
    eng.pub(source, 'c')
    eng.pub(source, 'd')

    vi.advanceTimersByTime(50)
    expect(history).toEqual(['d'])

    // New sequence
    eng.pub(source, 'x')
    eng.pub(source, 'y')

    vi.advanceTimersByTime(50)
    expect(history).toEqual(['d', 'y'])
  })

  // Edge cases
  it('handles zero delay correctly', () => {
    const source = Stream<number>()
    const debounced = e.pipe(source, e.debounceTime(0))
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(debounced, spy)

    eng.pub(source, 1)
    eng.pub(source, 2)

    vi.advanceTimersByTime(0)
    expect(history).toEqual([2])
  })

  it('handles very large delays', () => {
    const source = Stream<number>()
    const debounced = e.pipe(source, e.debounceTime(100000))
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(debounced, spy)

    eng.pub(source, 1)

    // Advance less than the delay
    vi.advanceTimersByTime(50000)
    expect(history).toEqual([])

    // Complete the delay
    vi.advanceTimersByTime(50000)
    expect(history).toEqual([1])
  })

  // Cleanup
  it('cleans up timeouts on unsubscribe', () => {
    const source = Stream<number>()
    const debounced = e.pipe(source, e.debounceTime(100))
    const { spy } = createSpyWithHistory<number>()

    const unsubscribe = eng.sub(debounced, spy)

    eng.pub(source, 1)
    eng.pub(source, 2)

    unsubscribe()

    // Even after delay, should not emit
    vi.advanceTimersByTime(100)
    expect(spy).not.toHaveBeenCalled()
  })

  // Multiple subscribers
  it('works correctly with multiple subscribers', () => {
    const source = Stream<number>()
    const debounced = e.pipe(source, e.debounceTime(100))

    const spy1 = createSpyWithHistory<number>()
    const spy2 = createSpyWithHistory<number>()

    e.sub(debounced, spy1.spy)
    e.sub(debounced, spy2.spy)

    eng.pub(source, 42)

    vi.advanceTimersByTime(100)

    expect(spy1.history).toEqual([42])
    expect(spy2.history).toEqual([42])
  })

  // Error handling
  it('handles source errors during debounce period', () => {
    const source = Stream<number>()
    const other = Stream<string>()
    const debounced = e.pipe(source, e.debounceTime(100))

    const spy1 = createSpyWithHistory<number>()
    const spy2 = createSpyWithHistory<string>()

    e.sub(debounced, spy1.spy)
    e.sub(other, spy2.spy)

    eng.pub(source, 1)

    // Other streams should work normally during debounce
    eng.pub(other, 'test')
    expect(spy2.history).toEqual(['test'])

    vi.advanceTimersByTime(100)
    expect(spy1.history).toEqual([1])

    // Should continue working after any issues
    eng.pub(source, 2)
    vi.advanceTimersByTime(100)
    expect(spy1.history).toEqual([1, 2])
  })

  // Value types
  it('handles null and undefined values', () => {
    const source = Stream<null | string | undefined>()
    const debounced = e.pipe(source, e.debounceTime(50))
    const { history, spy } = createSpyWithHistory<null | string | undefined>()

    e.sub(debounced, spy)

    eng.pub(source, null)
    vi.advanceTimersByTime(50)
    expect(history).toEqual([null])

    eng.pub(source, undefined)
    vi.advanceTimersByTime(50)
    expect(history).toEqual([null, undefined])

    eng.pub(source, 'string')
    vi.advanceTimersByTime(50)
    expect(history).toEqual([null, undefined, 'string'])
  })

  it('handles boolean values', () => {
    const source = Stream<boolean>()
    const debounced = e.pipe(source, e.debounceTime(30))
    const { history, spy } = createSpyWithHistory<boolean>()

    e.sub(debounced, spy)

    eng.pub(source, true)
    eng.pub(source, false)
    eng.pub(source, true)

    vi.advanceTimersByTime(30)
    expect(history).toEqual([true])
  })

  // Performance
  it('handles rapid successive emissions efficiently', () => {
    const source = Stream<number>()
    const debounced = e.pipe(source, e.debounceTime(100))
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(debounced, spy)

    // Rapid emissions
    for (let i = 0; i < 1000; i++) {
      eng.pub(source, i)
    }

    expect(history).toEqual([]) // No emissions yet

    vi.advanceTimersByTime(100)
    expect(history).toEqual([999]) // Only last value
  })

  // Timing precision
  it('maintains correct timing with overlapping sequences', () => {
    const source = Stream<string>()
    const debounced = e.pipe(source, e.debounceTime(100))
    const { history, spy } = createSpyWithHistory<string>()

    e.sub(debounced, spy)

    // First sequence
    eng.pub(source, 'a')
    vi.advanceTimersByTime(50)
    eng.pub(source, 'b') // Resets timer

    vi.advanceTimersByTime(100)
    expect(history).toEqual(['b'])

    // Second sequence immediately after
    eng.pub(source, 'x')
    eng.pub(source, 'y')

    vi.advanceTimersByTime(100)
    expect(history).toEqual(['b', 'y'])
  })

  it('handles intermittent emissions correctly', () => {
    const source = Stream<number>()
    const debounced = e.pipe(source, e.debounceTime(50))
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(debounced, spy)

    eng.pub(source, 1)
    vi.advanceTimersByTime(50)
    expect(history).toEqual([1])

    // Wait longer than debounce time
    vi.advanceTimersByTime(100)

    eng.pub(source, 2)
    vi.advanceTimersByTime(50)
    expect(history).toEqual([1, 2])
  })

  // Integration with other operators
  it('works correctly in operator chains', () => {
    const source = Stream<number>()
    const processed = e.pipe(
      source,
      e.map((x: number) => x * 2),
      e.debounceTime(50),
      e.map((x: number) => x + 1)
    )

    const { history, spy } = createSpyWithHistory<number>()
    e.sub(processed, spy)

    eng.pub(source, 5) // 5 * 2 = 10, debounced, then 10 + 1 = 11
    eng.pub(source, 3) // 3 * 2 = 6, debounced, then 6 + 1 = 7

    vi.advanceTimersByTime(50)
    expect(history).toEqual([7]) // Only last processed value
  })

  // Memory management
  it('does not leak memory with frequent timer resets', () => {
    const source = Stream<number>()
    const debounced = e.pipe(source, e.debounceTime(100))
    const { spy } = createSpyWithHistory<number>()

    e.sub(debounced, spy)

    // Create many timer resets
    for (let i = 0; i < 100; i++) {
      eng.pub(source, i)
      vi.advanceTimersByTime(50) // Don't complete any timers
    }

    // Should only have one active timer
    vi.advanceTimersByTime(50)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(99, eng)
  })

  // Edge timing cases
  it('handles emissions exactly at timer boundary', () => {
    const source = Stream<number>()
    const debounced = e.pipe(source, e.debounceTime(100))
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(debounced, spy)

    eng.pub(source, 1)

    // Advance to just before timer fires
    vi.advanceTimersByTime(99)
    expect(history).toEqual([])

    // New emission at boundary
    eng.pub(source, 2)

    // Original timer should be cancelled, new one started
    vi.advanceTimersByTime(99)
    expect(history).toEqual([])

    vi.advanceTimersByTime(1)
    expect(history).toEqual([2])
  })
})
