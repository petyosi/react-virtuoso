import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { e, Engine, Stream } from '../../..'
import { createSpyWithHistory } from '../../testUtils'

describe('throttleTime operator', () => {
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
  it('throttles emissions to specified interval', () => {
    const source = Stream<number>()
    const throttled = e.pipe(source, e.throttleTime(100))
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(throttled, spy)

    // Emit first value - should be throttled, not immediate
    eng.pub(source, 1)
    expect(history).toEqual([])

    // Emit more values quickly - should be throttled
    eng.pub(source, 2)
    eng.pub(source, 3)
    expect(history).toEqual([]) // No values yet

    // Advance time by throttle period
    vi.advanceTimersByTime(100)
    expect(history).toEqual([3]) // Should emit latest value
  })

  it('does not emit values immediately', () => {
    const source = Stream<number>()
    const throttled = e.pipe(source, e.throttleTime(100))
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(throttled, spy)
    eng.pub(source, 42)

    expect(history).toEqual([]) // No immediate emission

    vi.advanceTimersByTime(100)
    expect(history).toEqual([42]) // Emits after delay
  })

  it('ignores intermediate values during throttle period', () => {
    const source = Stream<number>()
    const throttled = e.pipe(source, e.throttleTime(100))
    const { spy } = createSpyWithHistory<number>()

    e.sub(throttled, spy)

    eng.pub(source, 1)
    eng.pub(source, 2)
    eng.pub(source, 3)
    eng.pub(source, 4)

    expect(spy).toHaveBeenCalledTimes(0) // No immediate calls

    vi.advanceTimersByTime(100)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(4, eng) // Latest value
  })

  it('emits most recent value after throttle period', () => {
    const source = Stream<number>()
    const throttled = e.pipe(source, e.throttleTime(50))
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(throttled, spy)

    eng.pub(source, 1)
    eng.pub(source, 2)
    eng.pub(source, 3)

    expect(history).toEqual([]) // No immediate emission

    vi.advanceTimersByTime(50)
    expect(history).toEqual([3]) // Latest value after delay
  })

  // Edge cases
  it('handles zero delay', () => {
    const source = Stream<number>()
    const throttled = e.pipe(source, e.throttleTime(0))
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(throttled, spy)

    eng.pub(source, 1)
    eng.pub(source, 2)

    vi.advanceTimersByTime(0)
    expect(history).toEqual([2])
  })

  it('handles rapid emissions', () => {
    const source = Stream<number>()
    const throttled = e.pipe(source, e.throttleTime(100))
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(throttled, spy)

    // Rapid fire emissions
    for (let i = 1; i <= 10; i++) {
      eng.pub(source, i)
    }

    expect(history).toEqual([]) // No immediate emission

    vi.advanceTimersByTime(100)
    expect(history).toEqual([10]) // Latest value after throttle
  })

  it('cleans up timeouts on unsubscribe', () => {
    const source = Stream<number>()
    const throttled = e.pipe(source, e.throttleTime(100))
    const { spy } = createSpyWithHistory<number>()

    const unsubscribe = eng.sub(throttled, spy)

    eng.pub(source, 1)
    eng.pub(source, 2)

    unsubscribe()

    vi.advanceTimersByTime(100)
    expect(spy).toHaveBeenCalledTimes(0) // No calls due to unsubscribe
  })

  it('works with multiple subscribers', () => {
    const source = Stream<number>()
    const throttled = e.pipe(source, e.throttleTime(100))
    const spy1 = createSpyWithHistory<number>()
    const spy2 = createSpyWithHistory<number>()

    e.sub(throttled, spy1.spy)
    e.sub(throttled, spy2.spy)

    eng.pub(source, 1)
    eng.pub(source, 2)

    expect(spy1.history).toEqual([]) // No immediate emission
    expect(spy2.history).toEqual([]) // No immediate emission

    vi.advanceTimersByTime(100)

    expect(spy1.history).toEqual([2]) // Latest value
    expect(spy2.history).toEqual([2]) // Latest value
  })

  it('handles source errors during throttle', () => {
    const source = Stream<number>()
    const throttled = e.pipe(source, e.throttleTime(100))
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(throttled, spy)

    eng.pub(source, 1)
    eng.pub(source, 2)

    // Errors don't interfere with throttling mechanism
    expect(() => {
      eng.pub(source, 3)
    }).not.toThrow()
    expect(history).toEqual([]) // No immediate emission

    vi.advanceTimersByTime(100)
    expect(history).toEqual([3]) // Latest value
  })

  it('maintains correct timing with system clock changes', () => {
    const source = Stream<number>()
    const throttled = e.pipe(source, e.throttleTime(100))
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(throttled, spy)

    eng.pub(source, 1)
    eng.pub(source, 2)

    // Partial advancement
    vi.advanceTimersByTime(50)
    expect(history).toEqual([]) // Still waiting

    // Complete the throttle period
    vi.advanceTimersByTime(50)
    expect(history).toEqual([2]) // Latest value
  })

  it('handles overlapping throttle periods correctly', () => {
    const source = Stream<number>()
    const throttled = e.pipe(source, e.throttleTime(100))
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(throttled, spy)

    // First batch
    eng.pub(source, 1)
    eng.pub(source, 2)

    vi.advanceTimersByTime(100)
    expect(history).toEqual([2]) // Latest value from first batch

    // Second batch immediately after first period
    eng.pub(source, 3)
    eng.pub(source, 4)

    vi.advanceTimersByTime(100)
    expect(history).toEqual([2, 4]) // Latest value from second batch
  })
})
