/** biome-ignore-all lint/style/noNonNullAssertion: in tests it's ok */
import { beforeEach, describe, expect, it } from 'vitest'

import { e, Engine, Stream } from '../../..'
import { createSpyWithHistory } from '../../testUtils'

describe('mapTo operator', () => {
  let eng!: Engine

  beforeEach(() => {
    eng = new Engine()
  })

  it('maintains proper typing with different target types', () => {
    const source = Stream<string>()

    // Map to number
    const mapped1 = e.pipe(source, e.mapTo(42))
    const spy1 = createSpyWithHistory<number>()
    e.sub(mapped1, spy1.spy)

    // Map to boolean
    const mapped2 = e.pipe(source, e.mapTo(true))
    const spy2 = createSpyWithHistory<boolean>()
    e.sub(mapped2, spy2.spy)

    eng.pub(source, 'anything')

    expect(spy1.history).toEqual([42])
    expect(spy2.history).toEqual([true])
  })

  // Null/undefined handling
  it('works with null and undefined target values', () => {
    const source = Stream<unknown>()

    // Map to null
    const mapped1 = e.pipe(source, e.mapTo(null))
    const spy1 = createSpyWithHistory<null>()
    e.sub(mapped1, spy1.spy)

    // Map to undefined
    const mapped2 = e.pipe(source, e.mapTo(undefined))
    e.setNodeLabel(mapped2, 'mapped2')
    const spy2 = createSpyWithHistory<undefined>()
    e.sub(mapped2, spy2.spy)

    eng.pub(source, 'anything')

    expect(spy1.history).toEqual([null])
    expect(spy2.history).toEqual([undefined])
  })

  // Multiple subscribers
  it('works correctly with multiple subscribers', () => {
    const source = Stream<number>()
    const targetValue = { shared: 'value' }
    const mapped = e.pipe(source, e.mapTo(targetValue))

    const spy1 = createSpyWithHistory<typeof targetValue>()
    const spy2 = createSpyWithHistory<typeof targetValue>()

    e.sub(mapped, spy1.spy)
    e.sub(mapped, spy2.spy)

    eng.pub(source, 1)

    expect(spy1.history).toEqual([targetValue])
    expect(spy2.history).toEqual([targetValue])
    expect(spy1.history[0]).toBe(targetValue)
    expect(spy2.history[0]).toBe(targetValue)
  })

  // Special value types
  it('handles functions as target values', () => {
    const source = Stream<unknown>()
    const targetFunction = () => 'I am a function'
    const mapped = e.pipe(source, e.mapTo(targetFunction))
    const { history, spy } = createSpyWithHistory<typeof targetFunction>()

    e.sub(mapped, spy)

    eng.pub(source, 'input')

    expect(history).toHaveLength(1)
    expect(typeof history[0]).toBe('function')
    expect(history[0]!()).toBe('I am a function')
  })

  it('handles RegExp as target values', () => {
    const source = Stream<unknown>()
    const targetRegex = /test-pattern/i
    const mapped = e.pipe(source, e.mapTo(targetRegex))
    const { history, spy } = createSpyWithHistory<RegExp>()

    e.sub(mapped, spy)

    eng.pub(source, 'input')

    expect(history[0]).toBe(targetRegex)
    expect(history[0]!.test('Test-Pattern')).toBe(true)
  })

  // Performance with high frequency
  it('handles rapid emissions efficiently', () => {
    const source = Stream<number>()
    const targetValue = 'constant'
    const mapped = e.pipe(source, e.mapTo(targetValue))
    const { history, spy } = createSpyWithHistory<string>()

    e.sub(mapped, spy)

    // Rapid emissions
    for (let i = 0; i < 1000; i++) {
      eng.pub(source, i)
    }

    expect(history).toHaveLength(1)
    expect(history[0]).toBe(targetValue)
  })

  // Edge cases with primitive types
  it('handles primitive number types', () => {
    const source = Stream<unknown>()

    // Regular number
    const mapped1 = e.pipe(source, e.mapTo(42))
    const spy1 = createSpyWithHistory<number>()
    e.sub(mapped1, spy1.spy)

    // Zero
    const mapped2 = e.pipe(source, e.mapTo(0))
    const spy2 = createSpyWithHistory<number>()
    e.sub(mapped2, spy2.spy)

    // Negative
    const mapped3 = e.pipe(source, e.mapTo(-1))
    const spy3 = createSpyWithHistory<number>()
    e.sub(mapped3, spy3.spy)

    // Infinity
    const mapped4 = e.pipe(source, e.mapTo(Infinity))
    const spy4 = createSpyWithHistory<number>()
    e.sub(mapped4, spy4.spy)

    // NaN
    const mapped5 = e.pipe(source, e.mapTo(NaN))
    const spy5 = createSpyWithHistory<number>()
    e.sub(mapped5, spy5.spy)

    eng.pub(source, 'test')

    expect(spy1.history).toEqual([42])
    expect(spy2.history).toEqual([0])
    expect(spy3.history).toEqual([-1])
    expect(spy4.history).toEqual([Infinity])
    expect(spy5.history[0]).toBeNaN()
  })

  it('handles string edge cases', () => {
    const source = Stream<unknown>()

    // Empty string
    const mapped1 = e.pipe(source, e.mapTo(''))
    const spy1 = createSpyWithHistory<string>()
    e.sub(mapped1, spy1.spy)

    // Whitespace
    const mapped2 = e.pipe(source, e.mapTo('   '))
    const spy2 = createSpyWithHistory<string>()
    e.sub(mapped2, spy2.spy)

    // Special characters
    const mapped3 = e.pipe(source, e.mapTo('\n\t\r'))
    const spy3 = createSpyWithHistory<string>()
    e.sub(mapped3, spy3.spy)

    eng.pub(source, 'input')

    expect(spy1.history).toEqual([''])
    expect(spy2.history).toEqual(['   '])
    expect(spy3.history).toEqual(['\n\t\r'])
  })
})
