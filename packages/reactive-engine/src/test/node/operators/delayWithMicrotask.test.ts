import { beforeEach, describe, expect, it } from 'vitest'

import { e, Engine, Stream } from '../../..'
import { createSpyWithHistory, waitForMicrotask } from '../../testUtils'

describe('delayWithMicrotask operator', () => {
  let eng!: Engine

  beforeEach(() => {
    eng = new Engine()
  })

  // Basic functionality
  it('delays emission to next microtask', async () => {
    const source = Stream<number>()
    const delayed = e.pipe(source, e.delayWithMicrotask())
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(delayed, spy)

    eng.pub(source, 42)

    // Should not have emitted yet
    expect(history).toEqual([])

    await waitForMicrotask()

    // Should have emitted after microtask
    expect(history).toEqual([42])
  })

  it('preserves emission order for multiple values', async () => {
    const source = Stream<number>()
    const delayed = e.pipe(source, e.delayWithMicrotask())
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(delayed, spy)

    // Emit multiple values synchronously
    eng.pub(source, 1)
    eng.pub(source, 2)
    eng.pub(source, 3)

    expect(history).toEqual([]) // Nothing emitted yet

    await waitForMicrotask()

    // All values should be emitted in order
    expect(history).toEqual([1, 2, 3])
  })

  // Edge cases
  it('handles null and undefined values', async () => {
    const source = Stream<null | undefined>()
    const delayed = e.pipe(source, e.delayWithMicrotask())
    const { history, spy } = createSpyWithHistory<null | undefined>()

    e.sub(delayed, spy)

    eng.pub(source, null)
    eng.pub(source, undefined)

    await waitForMicrotask()

    expect(history).toEqual([null, undefined])
  })

  // Timing behavior
  it('emissions occur after current synchronous execution', async () => {
    const source = Stream<string>()
    const delayed = e.pipe(source, e.delayWithMicrotask())
    const events: string[] = []

    e.sub(delayed, (value) => {
      events.push(`emitted: ${value}`)
    })

    events.push('before pub')
    eng.pub(source, 'test')
    events.push('after pub')

    expect(events).toEqual(['before pub', 'after pub'])

    await waitForMicrotask()

    expect(events).toEqual(['before pub', 'after pub', 'emitted: test'])
  })

  it('handles rapid successive publications', async () => {
    const source = Stream<number>()
    const delayed = e.pipe(source, e.delayWithMicrotask())
    const { history, spy } = createSpyWithHistory<number>()

    e.sub(delayed, spy)

    // Rapid publications
    for (let i = 0; i < 100; i++) {
      eng.pub(source, i)
    }

    expect(history).toEqual([])

    await waitForMicrotask()

    expect(history).toHaveLength(100)
    expect(history[0]).toBe(0)
    expect(history[99]).toBe(99)
  })
})
