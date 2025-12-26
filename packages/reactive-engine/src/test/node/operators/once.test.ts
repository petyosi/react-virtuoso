/** biome-ignore-all lint/style/noNonNullAssertion: tests */
import { beforeEach, describe, expect, it } from 'vitest'

import { e, Engine, Stream } from '../../..'
import { createSpyWithHistory } from '../../testUtils'

describe('once operator', () => {
  let eng!: Engine

  beforeEach(() => {
    eng = new Engine()
  })

  // Basic functionality
  it('emits only the first value', () => {
    const source = Stream<number>()
    const onceStream = e.pipe(source, e.once())
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(onceStream, spy)

    eng.pub(source, 1)
    eng.pub(source, 2)
    eng.pub(source, 3)

    expect(history).toEqual([1])
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('passes through the exact first value', () => {
    const source = Stream<unknown>()
    const onceStream = e.pipe(source, e.once())
    const { history, spy } = createSpyWithHistory()

    e.sub(onceStream, spy)

    const complexValue = { data: [1, 2, 3], id: 42, nested: { prop: 'test' } }
    eng.pub(source, complexValue)
    eng.pub(source, { different: 'object' })

    expect(history).toEqual([complexValue])
    expect(history[0]).toBe(complexValue) // Same reference
  })

  // Multiple subscribers
  it('works correctly with multiple subscribers', () => {
    const source = Stream<string>()
    const onceStream = e.pipe(source, e.once())

    const spy1 = createSpyWithHistory<string>()
    const spy2 = createSpyWithHistory<string>()

    e.sub(onceStream, spy1.spy)
    e.sub(onceStream, spy2.spy)

    eng.pub(source, 'first')
    eng.pub(source, 'second')

    expect(spy1.history).toEqual(['first'])
    expect(spy2.history).toEqual(['first'])
  })

  it('handles late subscribers after first emission', () => {
    const source = Stream<number>()
    const onceStream = e.pipe(source, e.once())

    const spy1 = createSpyWithHistory<number>()
    e.sub(onceStream, spy1.spy)

    eng.pub(source, 42)
    expect(spy1.history).toEqual([42])

    // Late subscriber should not receive the value
    const spy2 = createSpyWithHistory<number>()
    e.sub(onceStream, spy2.spy)

    eng.pub(source, 43)

    expect(spy1.history).toEqual([42]) // Still only one value
    expect(spy2.history).toEqual([]) // No values received
  })

  // Engine restart behavior
  it('resets properly when engine is recreated', () => {
    const source = Stream<number>()
    const onceStream = e.pipe(source, e.once())
    const { history: history1, spy: spy1 } = createSpyWithHistory<number>()

    e.sub(onceStream, spy1)
    eng.pub(source, 100)
    expect(history1).toEqual([100])

    // Create new engine - should reset the once state
    const newEng = new Engine()
    const { history: history2, spy: spy2 } = createSpyWithHistory<number>()

    newEng.sub(onceStream, spy2)
    newEng.pub(source, 200)

    expect(history2).toEqual([200]) // Fresh start, should emit again
  })

  // Error handling
  it('handles source errors appropriately', () => {
    const source = Stream<number>()
    const other = Stream<string>()
    const onceStream = e.pipe(source, e.once())

    const spy1 = createSpyWithHistory<number>()
    const spy2 = createSpyWithHistory<string>()

    e.sub(onceStream, spy1.spy)
    e.sub(other, spy2.spy)

    eng.pub(source, 1)
    expect(spy1.history).toEqual([1])

    // Other streams should continue working normally
    eng.pub(other, 'test')
    expect(spy2.history).toEqual(['test'])

    // Once stream should ignore further emissions
    eng.pub(source, 2)
    expect(spy1.history).toEqual([1])
  })

  // State cleanup
  it('maintains proper cleanup of internal state', () => {
    const source = Stream<number>()
    const onceStream = e.pipe(source, e.once())
    const { spy } = createSpyWithHistory<number>()

    const unsubscribe = eng.sub(onceStream, spy)

    eng.pub(source, 1)
    expect(spy).toHaveBeenCalledTimes(1)

    // Unsubscribe and resubscribe
    unsubscribe()

    const newSpy = createSpyWithHistory<number>()
    e.sub(onceStream, newSpy.spy)

    // Should not emit again even with new subscriber
    eng.pub(source, 2)
    expect(newSpy.history).toEqual([])
  })

  // Edge cases with various data types
  it('handles null and undefined values', () => {
    const source1 = Stream<null>()
    const source2 = Stream<undefined>()

    const once1 = e.pipe(source1, e.once())
    const once2 = e.pipe(source2, e.once())

    const spy1 = createSpyWithHistory<null>()
    const spy2 = createSpyWithHistory<undefined>()

    e.sub(once1, spy1.spy)
    e.sub(once2, spy2.spy)

    eng.pub(source1, null)
    eng.pub(source2, undefined)

    expect(spy1.history).toEqual([null])
    expect(spy2.history).toEqual([undefined])

    // Should not emit again
    eng.pub(source1, null)
    eng.pub(source2, undefined)

    expect(spy1.history).toEqual([null])
    expect(spy2.history).toEqual([undefined])
  })

  it('handles boolean values correctly', () => {
    const source = Stream<boolean>()
    const onceStream = e.pipe(source, e.once())
    const { history, spy } = createSpyWithHistory<boolean>()

    e.sub(onceStream, spy)

    eng.pub(source, false)
    eng.pub(source, true)
    eng.pub(source, false)

    expect(history).toEqual([false])
  })

  it('handles zero and empty string values', () => {
    const numSource = Stream<number>()
    const strSource = Stream<string>()

    const onceNum = e.pipe(numSource, e.once())
    const onceStr = e.pipe(strSource, e.once())

    const numSpy = createSpyWithHistory<number>()
    const strSpy = createSpyWithHistory<string>()

    e.sub(onceNum, numSpy.spy)
    e.sub(onceStr, strSpy.spy)

    eng.pub(numSource, 0)
    eng.pub(strSource, '')

    expect(numSpy.history).toEqual([0])
    expect(strSpy.history).toEqual([''])

    // Should not emit again
    eng.pub(numSource, 1)
    eng.pub(strSource, 'test')

    expect(numSpy.history).toEqual([0])
    expect(strSpy.history).toEqual([''])
  })

  // Integration with other operators
  it('works correctly in operator chains', () => {
    const source = Stream<number>()
    const processed = e.pipe(
      source,
      e.map((x: number) => x * 2),
      e.once(),
      e.map((x: number) => x + 1)
    )

    const { history, spy } = createSpyWithHistory<number>()
    e.sub(processed, spy)

    eng.pub(source, 5) // 5 * 2 = 10, then once, then 10 + 1 = 11
    eng.pub(source, 3) // Should be ignored by once

    expect(history).toEqual([11])
  })

  it('works when chained before and after other operators', () => {
    const source = Stream<number>()

    // Once before filter
    const stream1 = e.pipe(
      source,
      e.once(),
      e.filter((x: number) => x > 5)
    )

    // Once after filter
    const stream2 = e.pipe(
      source,
      e.filter((x: number) => x > 5),
      e.once()
    )

    const spy1 = createSpyWithHistory<number>()
    const spy2 = createSpyWithHistory<number>()

    e.sub(stream1, spy1.spy)
    e.sub(stream2, spy2.spy)

    eng.pub(source, 10) // Should pass filter
    eng.pub(source, 3) // Should not pass filter
    eng.pub(source, 8) // Should pass filter

    expect(spy1.history).toEqual([10]) // Once gets first value (10), filter passes it
    expect(spy2.history).toEqual([10]) // Filter passes first value (10), once takes it
  })

  // Performance with high frequency
  it('handles rapid emissions efficiently', () => {
    const source = Stream<number>()
    const onceStream = e.pipe(source, e.once())
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(onceStream, spy)

    // Rapid emissions
    for (let i = 0; i < 1000; i++) {
      eng.pub(source, i)
    }

    expect(history).toEqual([0]) // Only first value
    expect(spy).toHaveBeenCalledTimes(1)
  })

  // Memory and resource considerations
  it('does not accumulate state beyond first emission', () => {
    const source = Stream<{ data: number[] }>()
    const onceStream = e.pipe(source, e.once())
    const { history, spy } = createSpyWithHistory<{ data: number[] }>()

    e.sub(onceStream, spy)

    const firstValue = { data: [1, 2, 3] }
    eng.pub(source, firstValue)

    // Publish large objects that should be ignored
    for (let i = 0; i < 100; i++) {
      eng.pub(source, { data: new Array(1000).fill(i) })
    }

    expect(history).toEqual([firstValue])
    expect(history).toHaveLength(1)
  })

  // Type preservation
  it('preserves generic types correctly', () => {
    interface TestData<T> {
      id: number
      value: T
    }

    const source = Stream<TestData<string>>()
    const onceStream = e.pipe(source, e.once<TestData<string>>())
    const { history, spy } = createSpyWithHistory<TestData<string>>()

    e.sub(onceStream, spy)

    const testValue: TestData<string> = { id: 1, value: 'test' }
    eng.pub(source, testValue)
    eng.pub(source, { id: 2, value: 'ignored' })

    expect(history).toEqual([testValue])
    expect(history[0]?.value).toBe('test')
  })
})
