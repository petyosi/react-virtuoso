import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { domIOSystem } from '../src/domIOSystem'
import { normalizeIndexLocation, scrollToIndexSystem } from '../src/scrollToIndexSystem'
import { sizeSystem } from '../src/sizeSystem'
import { init, publish, subscribe, system, tup } from '../src/urx'

describe('normalizeIndexLocation', () => {
  it('does not mutate the passed location object', () => {
    const location = { index: 5 }
    normalizeIndexLocation(location)
    expect(location).toEqual({ index: 5 })
  })

  it('returns a new object with the defaults applied', () => {
    const location = { index: 5 }
    const result = normalizeIndexLocation(location)
    expect(result).not.toBe(location)
    expect(result).toEqual({ align: 'start', behavior: 'auto', index: 5, offset: 0 })
  })

  it('preserves explicitly provided fields', () => {
    const result = normalizeIndexLocation({ align: 'center', index: 2, offset: 10 })
    expect(result).toMatchObject({ align: 'center', index: 2, offset: 10 })
  })

  it('wraps a numeric location into an object with defaults', () => {
    expect(normalizeIndexLocation(7)).toEqual({ align: 'start', behavior: 'auto', index: 7, offset: 0 })
  })
})

describe('scrollToIndex retry window', () => {
  const testSystem = system(
    ([scrollToIndexOutput, { listRefresh, totalCount }, { scrollTo, viewportHeight }]) => ({
      ...scrollToIndexOutput,
      listRefresh,
      scrollTo,
      totalCount,
      viewportHeight,
    }),
    tup(scrollToIndexSystem, sizeSystem, domIOSystem)
  )

  function setup() {
    const engine = init(testSystem)
    publish(engine.totalCount, 100)
    publish(engine.viewportHeight, 200)
    const sub = vi.fn()
    subscribe(engine.scrollTo, sub)
    return { ...engine, sub }
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retries when the list changes within 150 ms of the navigation', () => {
    const { listRefresh, scrollToIndex, sub } = setup()

    publish(scrollToIndex, 10)
    vi.advanceTimersByTime(100)
    publish(listRefresh, true)

    expect(sub).toHaveBeenCalledTimes(2)
  })

  it('keeps retrying a navigation started within 150 ms of a previous one', () => {
    const { listRefresh, scrollToIndex, sub } = setup()

    publish(scrollToIndex, 0)
    vi.advanceTimersByTime(50)
    publish(scrollToIndex, 10)
    // the first navigation's 150 ms watch window ends here; the second one's is still open
    vi.advanceTimersByTime(110)
    publish(listRefresh, true)

    expect(sub).toHaveBeenCalledTimes(3)
  })
})
