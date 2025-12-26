/** biome-ignore-all lint/style/noNonNullAssertion: tests */
import { beforeEach, describe, expect, it } from 'vitest'

import { e, Engine, Stream } from '../../..'
import { createSpyWithHistory } from '../../testUtils'

describe('onNext operator', () => {
  let eng!: Engine

  beforeEach(() => {
    eng = new Engine()
  })

  // Basic functionality
  it('buffers source value until trigger emits', () => {
    const source = Stream<number>()
    const trigger = Stream<string>()
    const buffered = e.pipe(source, e.onNext(trigger))
    const { history, spy } = createSpyWithHistory<[number, string]>()

    e.sub(buffered, spy)

    // Source emits but trigger hasn't - no emission yet
    eng.pub(source, 42)
    expect(history).toEqual([])

    // Trigger emits - should emit buffered source with trigger value
    eng.pub(trigger, 'go')
    expect(history).toEqual([[42, 'go']])
  })

  it('emits source and trigger values as tuple', () => {
    const source = Stream<string>()
    const trigger = Stream<number>()
    const buffered = e.pipe(source, e.onNext(trigger))
    const { history, spy } = createSpyWithHistory<[string, number]>()

    e.sub(buffered, spy)

    eng.pub(source, 'hello')
    eng.pub(trigger, 123)

    expect(history).toEqual([['hello', 123]])
  })

  // Multiple values before trigger
  it('handles multiple source values before trigger', () => {
    const source = Stream<number>()
    const trigger = Stream<string>()
    const buffered = e.pipe(source, e.onNext(trigger))
    const { history, spy } = createSpyWithHistory<[number, string]>()

    e.sub(buffered, spy)

    // Multiple source values - only last should be kept
    eng.pub(source, 1)
    eng.pub(source, 2)
    eng.pub(source, 3)

    // No emissions yet
    expect(history).toEqual([])

    // Trigger should emit with last source value
    eng.pub(trigger, 'trigger')
    expect(history).toEqual([[3, 'trigger']])
  })

  it('overwrites buffered value with each source emission', () => {
    const source = Stream<string>()
    const trigger = Stream<boolean>()
    const buffered = e.pipe(source, e.onNext(trigger))
    const { history, spy } = createSpyWithHistory<[string, boolean]>()

    e.sub(buffered, spy)

    eng.pub(source, 'first')
    eng.pub(source, 'second')
    eng.pub(source, 'third')

    eng.pub(trigger, true)
    expect(history).toEqual([['third', true]])

    // Reset - new source value
    eng.pub(source, 'fourth')
    eng.pub(trigger, false)
    expect(history).toEqual([
      ['third', true],
      ['fourth', false],
    ])
  })

  // Trigger before source
  it('handles trigger firing before source has value', () => {
    const source = Stream<number>()
    const trigger = Stream<string>()
    const buffered = e.pipe(source, e.onNext(trigger))
    const { history, spy } = createSpyWithHistory<[number, string]>()

    e.sub(buffered, spy)

    // Trigger fires first - should not emit
    eng.pub(trigger, 'early')
    expect(history).toEqual([])

    // Source emits - still no emission
    eng.pub(source, 42)
    expect(history).toEqual([])

    // Another trigger - should emit now
    eng.pub(trigger, 'later')
    expect(history).toEqual([[42, 'later']])
  })

  it('ignores triggers when no source value is buffered', () => {
    const source = Stream<number>()
    const trigger = Stream<string>()
    const buffered = e.pipe(source, e.onNext(trigger))
    const { history, spy } = createSpyWithHistory<[number, string]>()

    e.sub(buffered, spy)

    // Multiple triggers without source
    eng.pub(trigger, 'trigger1')
    eng.pub(trigger, 'trigger2')
    eng.pub(trigger, 'trigger3')

    expect(history).toEqual([])

    // Source emits
    eng.pub(source, 100)
    expect(history).toEqual([])

    // Now trigger should work
    eng.pub(trigger, 'trigger4')
    expect(history).toEqual([[100, 'trigger4']])
  })

  // State reset behavior
  it('resets buffer after emission', () => {
    const source = Stream<number>()
    const trigger = Stream<string>()
    const buffered = e.pipe(source, e.onNext(trigger))
    const { history, spy } = createSpyWithHistory<[number, string]>()

    e.sub(buffered, spy)

    // First cycle
    eng.pub(source, 1)
    eng.pub(trigger, 'A')
    expect(history).toEqual([[1, 'A']])

    // Trigger again without new source - should not emit
    eng.pub(trigger, 'B')
    expect(history).toEqual([[1, 'A']]) // No change

    // New source value needed for next emission
    eng.pub(source, 2)
    eng.pub(trigger, 'C')
    expect(history).toEqual([
      [1, 'A'],
      [2, 'C'],
    ])
  })

  // Error handling
  it('handles errors from source and trigger nodes', () => {
    const source = Stream<number>()
    const trigger = Stream<string>()
    const other = Stream<string>()

    const buffered = e.pipe(source, e.onNext(trigger))

    const spy1 = createSpyWithHistory<[number, string]>()
    const spy2 = createSpyWithHistory<string>()

    e.sub(buffered, spy1.spy)
    e.sub(other, spy2.spy)

    eng.pub(source, 1)
    eng.pub(trigger, 'test')
    expect(spy1.history).toEqual([[1, 'test']])

    // Other streams should continue working normally
    eng.pub(other, 'normal')
    expect(spy2.history).toEqual(['normal'])

    // Buffer should continue working after any issues
    eng.pub(source, 2)
    eng.pub(trigger, 'test2')
    expect(spy1.history).toEqual([
      [1, 'test'],
      [2, 'test2'],
    ])
  })

  // Resource cleanup
  it('cleans up resources properly on unsubscribe', () => {
    const source = Stream<number>()
    const trigger = Stream<string>()
    const buffered = e.pipe(source, e.onNext(trigger))
    const { spy } = createSpyWithHistory<[number, string]>()

    const unsubscribe = eng.sub(buffered, spy)

    eng.pub(source, 1)
    unsubscribe()

    // After unsubscribe, should not emit even if trigger fires
    eng.pub(trigger, 'test')
    expect(spy).not.toHaveBeenCalled()
  })

  // Multiple subscribers
  it('works correctly with multiple subscribers', () => {
    const source = Stream<number>()
    const trigger = Stream<string>()
    const buffered = e.pipe(source, e.onNext(trigger))

    const spy1 = createSpyWithHistory<[number, string]>()
    const spy2 = createSpyWithHistory<[number, string]>()

    e.sub(buffered, spy1.spy)
    e.sub(buffered, spy2.spy)

    eng.pub(source, 42)
    eng.pub(trigger, 'shared')

    expect(spy1.history).toEqual([[42, 'shared']])
    expect(spy2.history).toEqual([[42, 'shared']])
  })

  // Rapid fire scenarios
  it('works with rapid fire triggers', () => {
    const source = Stream<number>()
    const trigger = Stream<number>()
    const buffered = e.pipe(source, e.onNext(trigger))
    const { history, spy } = createSpyWithHistory<[number, number]>()

    e.sub(buffered, spy)

    eng.pub(source, 100)

    // Rapid triggers
    for (let i = 0; i < 10; i++) {
      eng.pub(trigger, i)
    }

    // Should only emit once since buffer was consumed on first trigger
    expect(history).toEqual([[100, 0]])

    // New source value
    eng.pub(source, 200)

    // More rapid triggers
    for (let i = 10; i < 20; i++) {
      eng.pub(trigger, i)
    }

    // Should emit once with first trigger value
    expect(history).toEqual([
      [100, 0],
      [200, 10],
    ])
  })

  it('handles rapid source emissions correctly', () => {
    const source = Stream<number>()
    const trigger = Stream<string>()
    const buffered = e.pipe(source, e.onNext(trigger))
    const { history, spy } = createSpyWithHistory<[number, string]>()

    e.sub(buffered, spy)

    // Rapid source emissions
    for (let i = 0; i < 100; i++) {
      eng.pub(source, i)
    }

    // Should buffer only the last value
    eng.pub(trigger, 'done')
    expect(history).toEqual([[99, 'done']])
  })

  // Edge cases with various data types
  it('handles null and undefined values', () => {
    const source = Stream<null | number | undefined>()
    const trigger = Stream<null | string | undefined>()
    const buffered = e.pipe(source, e.onNext(trigger))
    const { history, spy } = createSpyWithHistory<[null | number | undefined, null | string | undefined]>()

    e.sub(buffered, spy)

    eng.pub(source, null)
    eng.pub(trigger, undefined)
    expect(history).toEqual([[null, undefined]])

    eng.pub(source, undefined)
    eng.pub(trigger, null)
    expect(history).toEqual([
      [null, undefined],
      [undefined, null],
    ])

    eng.pub(source, 42)
    eng.pub(trigger, 'string')
    expect(history).toEqual([
      [null, undefined],
      [undefined, null],
      [42, 'string'],
    ])
  })

  it('handles complex object types', () => {
    interface SourceData {
      id: number
      payload: unknown
    }

    interface TriggerData {
      action: string
      timestamp: number
    }

    const source = Stream<SourceData>()
    const trigger = Stream<TriggerData>()
    const buffered = e.pipe(source, e.onNext(trigger))
    const { history, spy } = createSpyWithHistory<[SourceData, TriggerData]>()

    e.sub(buffered, spy)

    const sourceValue = { id: 123, payload: { nested: 'data' } }
    const triggerValue = { action: 'process', timestamp: Date.now() }

    eng.pub(source, sourceValue)
    eng.pub(trigger, triggerValue)

    expect(history).toHaveLength(1)
    expect(history[0]![0]).toBe(sourceValue)
    expect(history[0]![1]).toBe(triggerValue)
  })

  // Integration with other operators
  it('works correctly in operator chains', () => {
    const source = Stream<number>()
    const trigger = Stream<string>()

    const processed = e.pipe(
      source,
      e.map((x: number) => x * 2),
      e.onNext(trigger),
      e.map(([num, str]) => `${str}: ${num}`)
    )

    const { history, spy } = createSpyWithHistory<string>()
    e.sub(processed, spy)

    eng.pub(source, 5) // 5 * 2 = 10
    eng.pub(trigger, 'result')

    expect(history).toEqual(['result: 10'])
  })
})
